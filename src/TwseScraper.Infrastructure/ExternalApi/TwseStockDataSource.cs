using System.Text.Json;
using System.Text.Json.Serialization;
using TwseScraper.Domain.Entities;
using TwseScraper.Domain.Interfaces;
using TwseScraper.Domain.ValueObjects;
using TwseScraper.Infrastructure.Configuration;

namespace TwseScraper.Infrastructure.ExternalApi;

/// <summary>
/// TWSE API 回傳的 JSON 模型（僅用於反序列化）
/// </summary>
internal class TwseApiStockDto
{
    [JsonPropertyName("Code")]
    public string? Code { get; set; }

    [JsonPropertyName("Name")]
    public string? Name { get; set; }

    [JsonPropertyName("ClosingPrice")]
    public string? ClosingPrice { get; set; }
}

/// <summary>
/// TWSE OpenAPI 股票資料來源實作
/// 實作重試機制與指數退避
/// </summary>
public class TwseStockDataSource : IStockDataSource
{
    private readonly HttpClient _httpClient;
    private readonly ScraperSettings _settings;

    public TwseStockDataSource(HttpClient httpClient, ScraperSettings settings)
    {
        _httpClient = httpClient;
        _settings = settings;
    }

    public async Task<TwseStockData?> FetchStockAsync(StockCode stockCode, CancellationToken ct = default)
    {
        var json = await FetchWithRetryAsync(_settings.ApiUrl, ct);

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var allStocks = JsonSerializer.Deserialize<List<TwseApiStockDto>>(json, options);

        if (allStocks is null)
            return null;

        var match = allStocks.FirstOrDefault(s => s.Code == stockCode.Value);
        if (match?.Code is null || match.Name is null || match.ClosingPrice is null)
            return null;

        return new TwseStockData(match.Code, match.Name, match.ClosingPrice);
    }

    private async Task<string> FetchWithRetryAsync(string url, CancellationToken ct)
    {
        int maxRetries = _settings.RetryAttempts;
        int delaySeconds = _settings.RetryDelaySeconds;

        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                Console.WriteLine($"正在下載資料 (第 {attempt}/{maxRetries} 次)... {url}");
                var response = await _httpClient.GetStringAsync(url, ct);
                Console.WriteLine($"下載完成 (第 {attempt} 次嘗試成功)");
                return response;
            }
            catch (Exception ex) when (attempt < maxRetries && ex is not OperationCanceledException)
            {
                Console.WriteLine($"第 {attempt} 次嘗試失敗: {ex.Message}");
                int waitMs = delaySeconds * 1000 * (int)Math.Pow(2, attempt - 1);
                Console.WriteLine($"等待 {waitMs / 1000} 秒後重試...");
                await Task.Delay(waitMs, ct);
            }
        }

        Console.WriteLine($"正在下載資料 (最後嘗試)... {url}");
        return await _httpClient.GetStringAsync(url, ct);
    }
}
