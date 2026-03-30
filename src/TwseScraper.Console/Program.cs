using System.Text.Json;
using TwseScraper.Application.UseCases;
using TwseScraper.Infrastructure.Configuration;
using TwseScraper.Infrastructure.ExternalApi;
using TwseScraper.Infrastructure.Persistence;

// 載入設定
var settings = LoadSettings();
Console.WriteLine($"[設定] 目標股票: {settings.TargetStock}");
Console.WriteLine($"[設定] API: {settings.ApiUrl}");
Console.WriteLine($"[設定] 重試次數: {settings.RetryAttempts}");

try
{
    // 組裝依賴 (Composition Root)
    using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    var dataSource = new TwseStockDataSource(httpClient, settings);
    var repository = new JsonFileStockPriceRepository(settings);
    var useCase = new ScrapeStockPriceUseCase(dataSource, repository);

    // 執行用例
    var result = await useCase.ExecuteAsync(settings.TargetStock);

    if (result.Success)
    {
        Console.WriteLine($"股票代碼: {result.StockCode}");
        Console.WriteLine($"股票名稱: {result.StockName}");
        Console.WriteLine($"收盤價: {result.Price}");
        Console.WriteLine($"日期: {result.Date}");
    }
    else
    {
        Console.WriteLine(result.ErrorMessage);
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine($"發生錯誤: {ex.Message}");
    Environment.Exit(1);
}

static ScraperSettings LoadSettings()
{
    // 先找工作目錄，再找應用程式目錄
    string[] searchPaths = [
        "appsettings.json",
        Path.Combine(AppContext.BaseDirectory, "appsettings.json")
    ];

    foreach (var settingsPath in searchPaths)
    {
        if (!File.Exists(settingsPath)) continue;

        try
        {
            string json = File.ReadAllText(settingsPath);
            using var doc = JsonDocument.Parse(json);
            var section = doc.RootElement.GetProperty("StockSettings");
            var settings = JsonSerializer.Deserialize<ScraperSettings>(section.GetRawText());
            if (settings != null)
            {
                Console.WriteLine($"[設定] 已從 {settingsPath} 載入設定");
                return settings;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[設定] 讀取 {settingsPath} 失敗: {ex.Message}");
        }
    }

    Console.WriteLine("[設定] 未找到 appsettings.json，使用預設值");
    return new ScraperSettings();
}
