using TwseScraper.Domain.ValueObjects;

namespace TwseScraper.Domain.Entities;

/// <summary>
/// 股價記錄 — 領域實體
/// 代表某一天某支股票的收盤價
/// </summary>
public class StockPriceRecord
{
    public DateOnly Date { get; }
    public StockCode StockCode { get; }
    public StockPrice Price { get; }

    public StockPriceRecord(DateOnly date, StockCode stockCode, StockPrice price)
    {
        Date = date;
        StockCode = stockCode ?? throw new ArgumentNullException(nameof(stockCode));
        Price = price ?? throw new ArgumentNullException(nameof(price));
    }

    /// <summary>
    /// 從 TWSE API 原始資料建立實體
    /// </summary>
    public static StockPriceRecord Create(string date, string stockCode, string closingPrice)
    {
        return new StockPriceRecord(
            DateOnly.Parse(date),
            new StockCode(stockCode),
            new StockPrice(closingPrice)
        );
    }
}
