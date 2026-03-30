namespace TwseScraper.Domain.Entities;

/// <summary>
/// TWSE API 回傳的股票資料（原始資料映射）
/// </summary>
public class TwseStockData
{
    public string Code { get; }
    public string Name { get; }
    public string ClosingPrice { get; }

    public TwseStockData(string code, string name, string closingPrice)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        ClosingPrice = closingPrice ?? throw new ArgumentNullException(nameof(closingPrice));
    }
}
