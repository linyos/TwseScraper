namespace TwseScraper.Infrastructure.Configuration;

/// <summary>
/// 爬蟲設定（對應 appsettings.json 的 StockSettings 區段）
/// </summary>
public class ScraperSettings
{
    public string ApiUrl { get; set; } = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
    public string TargetStock { get; set; } = "2330";
    public string OutputDirectory { get; set; } = "data";
    public int MaxFileSizeMB { get; set; } = 700;
    public int RetryAttempts { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 2;
}
