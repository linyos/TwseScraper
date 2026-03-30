namespace TwseScraper.Application.DTOs;

/// <summary>
/// 爬蟲執行結果 DTO
/// </summary>
public class ScrapeResultDto
{
    public bool Success { get; init; }
    public string StockCode { get; init; } = string.Empty;
    public string StockName { get; init; } = string.Empty;
    public string Date { get; init; } = string.Empty;
    public string Price { get; init; } = string.Empty;
    public string? ErrorMessage { get; init; }

    public static ScrapeResultDto Ok(string stockCode, string stockName, string date, string price)
        => new()
        {
            Success = true,
            StockCode = stockCode,
            StockName = stockName,
            Date = date,
            Price = price
        };

    public static ScrapeResultDto Fail(string error)
        => new() { Success = false, ErrorMessage = error };
}
