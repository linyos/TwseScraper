using TwseScraper.Domain.Entities;
using TwseScraper.Domain.ValueObjects;

namespace TwseScraper.Domain.Interfaces;

/// <summary>
/// 股價記錄儲存庫介面 — 負責持久化股價資料
/// </summary>
public interface IStockPriceRepository
{
    Task<List<StockPriceRecord>> LoadAsync(StockCode stockCode, CancellationToken ct = default);
    Task SaveAsync(StockCode stockCode, List<StockPriceRecord> records, CancellationToken ct = default);
    Task UpdateManifestAsync(StockCode stockCode, CancellationToken ct = default);
}
