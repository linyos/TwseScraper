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

    public override string ToString() => RawValue;
}
