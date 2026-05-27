namespace TwseScraper.Domain.Entities;

/// <summary>
/// TWSE API 回傳的股票資料（原始資料映射）
/// </summary>
public class TwseStockData
{
    public string Code { get; }
    public string Name { get; }
    public string ClosingPrice { get; }
    public string? OpeningPrice { get; }
    public string? HighestPrice { get; }
    public string? LowestPrice { get; }
    public string? TradeVolume { get; }

    public TwseStockData(string code, string name, string closingPrice,
        string? openingPrice = null, string? highestPrice = null,
        string? lowestPrice = null, string? tradeVolume = null)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        ClosingPrice = closingPrice ?? throw new ArgumentNullException(nameof(closingPrice));
        OpeningPrice = openingPrice;
        HighestPrice = highestPrice;
        LowestPrice = lowestPrice;
        TradeVolume = tradeVolume;
    }
}
