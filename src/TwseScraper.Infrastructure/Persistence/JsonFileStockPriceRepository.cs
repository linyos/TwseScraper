using System.Text.Json;
using TwseScraper.Domain.Entities;
using TwseScraper.Domain.Interfaces;
using TwseScraper.Domain.ValueObjects;
using TwseScraper.Infrastructure.Configuration;

namespace TwseScraper.Infrastructure.Persistence;

/// <summary>
/// JSON 序列化用的扁平模型
/// </summary>
internal class StockPriceDto
{
    public string? Date { get; set; }
    public string? StockNo { get; set; }
    public string? Price { get; set; }
}

/// <summary>
/// 檔案式股價儲存庫
/// 負責分割大檔案、讀寫 JSON、維護 files.json 清單
/// </summary>
public class JsonFileStockPriceRepository : IStockPriceRepository
{
    private readonly ScraperSettings _settings;
    private static readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    public JsonFileStockPriceRepository(ScraperSettings settings)
    {
        _settings = settings;
    }

    public async Task<List<StockPriceRecord>> LoadAsync(StockCode stockCode, CancellationToken ct = default)
    {
        EnsureDirectoryExists();

        string baseFileName = $"stock_{stockCode.Value}";
        string currentFileName = GetCurrentFileName(baseFileName);
        string fullPath = Path.Combine(_settings.OutputDirectory, currentFileName);

        if (!File.Exists(fullPath))
            return new List<StockPriceRecord>();

        string json = await File.ReadAllTextAsync(fullPath, ct);
        var dtos = DeserializeDtos(json);

        return dtos
            .Where(d => d.Date != null && d.StockNo != null && d.Price != null)
            .Select(d => StockPriceRecord.Create(d.Date!, d.StockNo!, d.Price!))
            .ToList();
    }

    public async Task SaveAsync(StockCode stockCode, List<StockPriceRecord> records, CancellationToken ct = default)
    {
        EnsureDirectoryExists();

        string baseFileName = $"stock_{stockCode.Value}";
        string currentFileName = GetCurrentFileName(baseFileName);
        string fullPath = Path.Combine(_settings.OutputDirectory, currentFileName);

        var dtos = records.Select(r => new StockPriceDto
        {
            Date = r.Date.ToString("yyyy-MM-dd"),
            StockNo = r.StockCode.Value,
            Price = r.Price.RawValue
        }).ToList();

        string jsonString = JsonSerializer.Serialize(dtos, _jsonOptions);

        // 檢查檔案大小，超過上限則分割
        long maxBytes = (long)_settings.MaxFileSizeMB * 1024 * 1024;
        if (jsonString.Length > maxBytes && File.Exists(fullPath))
        {
            currentFileName = GetNextFileName(baseFileName);
            fullPath = Path.Combine(_settings.OutputDirectory, currentFileName);

            // 只保留最後一筆到新檔案
            var lastDto = dtos.Last();
            jsonString = JsonSerializer.Serialize(new List<StockPriceDto> { lastDto }, _jsonOptions);
            Console.WriteLine($"檔案超過 {_settings.MaxFileSizeMB}MB，建立新檔案: {currentFileName}");
        }

        await File.WriteAllTextAsync(fullPath, jsonString, ct);
        Console.WriteLine($"資料已新增至檔案: {currentFileName}");
        Console.WriteLine($"目前檔案大小: {new FileInfo(fullPath).Length / (1024.0 * 1024):F2} MB");
    }

    public Task UpdateManifestAsync(StockCode stockCode, CancellationToken ct = default)
    {
        string baseFileName = $"stock_{stockCode.Value}";
        try
        {
            var files = Directory.GetFiles(_settings.OutputDirectory, $"{baseFileName}_*.json")
                .Select(Path.GetFileName)
                .OrderBy(f => f)
                .ToList();

            var manifest = new { files };
            string manifestPath = Path.Combine(_settings.OutputDirectory, "files.json");
            string json = JsonSerializer.Serialize(manifest, _jsonOptions);
            File.WriteAllText(manifestPath, json);
            Console.WriteLine($"已更新檔案清單: files.json (共 {files.Count} 個檔案)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"警告: 無法更新 files.json - {ex.Message}");
        }

        return Task.CompletedTask;
    }

    private void EnsureDirectoryExists()
    {
        if (!Directory.Exists(_settings.OutputDirectory))
            Directory.CreateDirectory(_settings.OutputDirectory);
    }

    private string GetCurrentFileName(string baseFileName)
    {
        var files = Directory.GetFiles(_settings.OutputDirectory, $"{baseFileName}_*.json")
            .OrderByDescending(f => f)
            .ToList();

        if (files.Count == 0)
            return $"{baseFileName}_001.json";

        string latestFilePath = files.First();
        var fileInfo = new FileInfo(latestFilePath);
        if (fileInfo.Length > (long)_settings.MaxFileSizeMB * 1024 * 1024)
            return GetNextFileName(baseFileName);

        return Path.GetFileName(latestFilePath);
    }

    private string GetNextFileName(string baseFileName)
    {
        var files = Directory.GetFiles(_settings.OutputDirectory, $"{baseFileName}_*.json");
        int maxNumber = 0;

        foreach (var file in files)
        {
            string fileName = Path.GetFileNameWithoutExtension(file);
            string[] parts = fileName.Split('_');
            if (parts.Length >= 3 && int.TryParse(parts[2], out int number))
                maxNumber = Math.Max(maxNumber, number);
        }

        return $"{baseFileName}_{(maxNumber + 1):D3}.json";
    }

    private static List<StockPriceDto> DeserializeDtos(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<StockPriceDto>>(json) ?? new List<StockPriceDto>();
        }
        catch (JsonException)
        {
            try
            {
                var single = JsonSerializer.Deserialize<StockPriceDto>(json);
                if (single != null)
                {
                    Console.WriteLine("偵測到舊格式檔案，已轉換為陣列格式");
                    return new List<StockPriceDto> { single };
                }
            }
            catch (JsonException)
            {
                Console.WriteLine("無法解析現有檔案，建立新的資料陣列");
            }
        }
        return new List<StockPriceDto>();
    }
}
