namespace TwseScraper.Domain.ValueObjects;

/// <summary>
/// 股價值物件（使用 decimal 避免浮點精度問題）
/// </summary>
public sealed record StockPrice
{
    public decimal Value { get; }
    public string RawValue { get; }

    public StockPrice(string rawPrice)
    {
        if (string.IsNullOrWhiteSpace(rawPrice))
            throw new ArgumentException("股價不可為空", nameof(rawPrice));

        RawValue = rawPrice.Trim();

        if (!decimal.TryParse(RawValue, out var parsed))
            throw new ArgumentException($"無效的股價格式: {rawPrice}", nameof(rawPrice));

        Value = parsed;
    }

    /// <summary>
    /// 嘗試建立 StockPrice，若輸入無效（如 "--"）則回傳 null
    /// </summary>
    public static StockPrice? TryCreate(string? rawPrice)
    {
        if (string.IsNullOrWhiteSpace(rawPrice)) return null;
        var trimmed = rawPrice.Trim();
        if (!decimal.TryParse(trimmed, out _)) return null;
        return new StockPrice(trimmed);
    }

    public override string ToString() => RawValue;
}
