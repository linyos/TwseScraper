namespace TwseScraper.Domain.ValueObjects;

/// <summary>
/// 股票代碼值物件
/// </summary>
public sealed record StockCode
{
    public string Value { get; }

    public StockCode(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("股票代碼不可為空", nameof(value));

        Value = value.Trim();
    }

    public override string ToString() => Value;
}
