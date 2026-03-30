using TwseScraper.Domain.Entities;
using TwseScraper.Domain.ValueObjects;

namespace TwseScraper.Domain.Interfaces;

/// <summary>
/// 股票資料來源介面 — 從外部 API 取得股價
/// </summary>
public interface IStockDataSource
{
    Task<TwseStockData?> FetchStockAsync(StockCode stockCode, CancellationToken ct = default);
}
