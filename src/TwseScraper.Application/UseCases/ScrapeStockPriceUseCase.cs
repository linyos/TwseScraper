using TwseScraper.Application.DTOs;
using TwseScraper.Domain.Entities;
using TwseScraper.Domain.Interfaces;
using TwseScraper.Domain.ValueObjects;

namespace TwseScraper.Application.UseCases;

/// <summary>
/// 爬取並儲存股價用例
/// 協調 Domain 層的介面完成：取得股價 → 建立實體 → 持久化
/// </summary>
public class ScrapeStockPriceUseCase
{
    private readonly IStockDataSource _dataSource;
    private readonly IStockPriceRepository _repository;

    public ScrapeStockPriceUseCase(IStockDataSource dataSource, IStockPriceRepository repository)
    {
        _dataSource = dataSource;
        _repository = repository;
    }

    public async Task<ScrapeResultDto> ExecuteAsync(string targetStockCode, CancellationToken ct = default)
    {
        var stockCode = new StockCode(targetStockCode);

        // 1. 從外部 API 取得股價
        var stockData = await _dataSource.FetchStockAsync(stockCode, ct);
        if (stockData is null)
            return ScrapeResultDto.Fail($"找不到股票代碼為 {stockCode} 的資料");

        // 2. 建立領域實體
        var twTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Taipei Standard Time");
        var dateStr = twTime.ToString("yyyy-MM-dd");

        var record = StockPriceRecord.Create(dateStr, stockData.Code, stockData.ClosingPrice);

        // 3. 載入既有記錄並追加
        var existingRecords = await _repository.LoadAsync(stockCode, ct);
        existingRecords.Add(record);

        // 4. 儲存
        await _repository.SaveAsync(stockCode, existingRecords, ct);

        // 5. 更新檔案清單
        await _repository.UpdateManifestAsync(stockCode, ct);

        return ScrapeResultDto.Ok(stockData.Code, stockData.Name, dateStr, stockData.ClosingPrice);
    }
}
