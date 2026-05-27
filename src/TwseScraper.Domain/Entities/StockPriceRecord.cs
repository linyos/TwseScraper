using TwseScraper.Domain.ValueObjects;

namespace TwseScraper.Domain.Entities;

/// <summary>
/// 股價記錄 — 領域實體
/// 代表某一天某支股票的 OHLCV 資料
/// </summary>
public class StockPriceRecord
{
    public DateOnly Date { get; }
    public StockCode StockCode { get; }
    public StockPrice Price { get; }
    public StockPrice? OpenPrice { get; }
    public StockPrice? HighPrice { get; }
    public StockPrice? LowPrice { get; }
    public long? Volume { get; }

    public StockPriceRecord(DateOnly date, StockCode stockCode, StockPrice price,
        StockPrice? openPrice = null, StockPrice? highPrice = null,
        StockPrice? lowPrice = null, long? volume = null)
    {
        Date = date;
        StockCode = stockCode ?? throw new ArgumentNullException(nameof(stockCode));
        Price = price ?? throw new ArgumentNullException(nameof(price));
        OpenPrice = openPrice;
        HighPrice = highPrice;
        LowPrice = lowPrice;
        Volume = volume;
    }

    /// <summary>
    /// 從 TWSE API 原始資料建立實體
    /// </summary>
    public static StockPriceRecord Create(string date, string stockCode, string closingPrice,
        string? openingPrice = null, string? highestPrice = null,
        string? lowestPrice = null, string? tradeVolume = null)
    {
        long? volume = null;
        if (!string.IsNullOrWhiteSpace(tradeVolume) &&
            long.TryParse(tradeVolume.Replace(",", ""), out var parsed))
            volume = parsed;

        return new StockPriceRecord(
            DateOnly.Parse(date),
            new StockCode(stockCode),
            new StockPrice(closingPrice),
            StockPrice.TryCreate(openingPrice),
            StockPrice.TryCreate(highestPrice),
            StockPrice.TryCreate(lowestPrice),
            volume
        );
    }
}
