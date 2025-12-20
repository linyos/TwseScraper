using System.Text.Json;
using System.Text.Json.Serialization;
using TwseScraper.Model;

// 主程式進入點
    string url = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
    string targetStock = "2330"; // 台積電
    try
    {
        using HttpClient client = new HttpClient();
        Console.WriteLine($"正在下載資料... {url}");
        // 2. 取得 JSON 資料
        string jsonResponse = await client.GetStringAsync(url);

        var options = new JsonSerializerOptions { 
            PropertyNameCaseInsensitive = true };
        var allStocks = JsonSerializer.Deserialize<List<StockData>>(jsonResponse, options);
    
        if (allStocks == null)
        {
            Console.WriteLine("無法解析股票資料。");
            return;
        }    

        var tsmcData = allStocks.FirstOrDefault(stock => stock.Code == targetStock);
        if (tsmcData != null)
        {
            Console.WriteLine($"股票代碼: {tsmcData.Code}");
            Console.WriteLine($"股票名稱: {tsmcData.Name}");
            Console.WriteLine($"收盤價: {tsmcData.ClosingPrice}");

            var twTime = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Taipei Standard Time");
            var newData = new SavedData
                {
                    Date = twTime.ToString("yyyy-MM-dd"),
                    StockNo = tsmcData.Code,
                    Price = tsmcData.ClosingPrice
                };
            
            // 5. 確保 data 資料夾存在
            string outputDir = "data";
            if (!Directory.Exists(outputDir)) Directory.CreateDirectory(outputDir);

            // 6. 取得目前最新的檔案名稱
            string baseFileName = $"stock_{targetStock}";
            string currentFileName = GetCurrentFileName(outputDir, baseFileName);
            string fullPath = Path.Combine(outputDir, currentFileName);
            
            // 7. 讀取現有資料或建立新陣列
            List<SavedData> stockDataList;
            if (File.Exists(fullPath))
            {
                string existingJson = await File.ReadAllTextAsync(fullPath);
                try
                {
                    // 嘗試解析為陣列格式
                    stockDataList = JsonSerializer.Deserialize<List<SavedData>>(existingJson) ?? new List<SavedData>();
                }
                catch (JsonException)
                {
                    // 如果失敗，可能是舊的單一物件格式，嘗試解析為單一物件
                    try
                    {
                        var singleData = JsonSerializer.Deserialize<SavedData>(existingJson);
                        stockDataList = singleData != null ? new List<SavedData> { singleData } : new List<SavedData>();
                        Console.WriteLine("偵測到舊格式檔案，已轉換為陣列格式");
                    }
                    catch (JsonException)
                    {
                        // 如果都失敗，建立新的陣列
                        Console.WriteLine("無法解析現有檔案，建立新的資料陣列");
                        stockDataList = new List<SavedData>();
                    }
                }
            }
            else
            {
                stockDataList = new List<SavedData>();
            }
            
            // 8. 新增新資料
            stockDataList.Add(newData);
            
            // 9. 序列化資料
            string jsonString = JsonSerializer.Serialize(stockDataList, new JsonSerializerOptions { WriteIndented = true });
            
            // 10. 檢查檔案大小 (700MB = 734,003,200 bytes)
            if (jsonString.Length > 734003200 && File.Exists(fullPath))
            {
                // 如果超過700MB，建立新檔案
                currentFileName = GetNextFileName(outputDir, baseFileName);
                fullPath = Path.Combine(outputDir, currentFileName);
                stockDataList = new List<SavedData> { newData };
                jsonString = JsonSerializer.Serialize(stockDataList, new JsonSerializerOptions { WriteIndented = true });
                Console.WriteLine($"檔案超過700MB，建立新檔案: {currentFileName}");
            }
            
            // 11. 寫入檔案
            await File.WriteAllTextAsync(fullPath, jsonString);
            Console.WriteLine($"資料已新增至檔案: {currentFileName}");
            Console.WriteLine($"目前檔案大小: {new FileInfo(fullPath).Length / (1024 * 1024):F2} MB");
            
            // 12. 更新檔案清單
            UpdateFilesManifest(outputDir, baseFileName);
        }
        else
        {
            Console.WriteLine($"找不到股票代碼為 {targetStock} 的資料。");
        } 
    
    }
    catch (System.Exception ex)
    {
        Console.Error.WriteLine($"發生錯誤: {ex.Message}");
        Environment.Exit(1); // 讓 Action 知道失敗了
       
    }

// 取得目前應使用的檔案名稱
static string GetCurrentFileName(string directory, string baseFileName)
{
    // 尋找現有的檔案，格式: stock_2330_001.json, stock_2330_002.json 等
    var files = Directory.GetFiles(directory, $"{baseFileName}_*.json")
                        .OrderByDescending(f => f)
                        .ToList();
    
    if (files.Count == 0)
    {
        return $"{baseFileName}_001.json";
    }
    
    // 取得最新的檔案
    string latestFile = Path.GetFileName(files.First());
    
    // 檢查最新檔案是否已達到大小限制
    string latestFilePath = files.First();
    if (File.Exists(latestFilePath))
    {
        var fileInfo = new FileInfo(latestFilePath);
        // 如果檔案接近700MB (預留一些空間)
        if (fileInfo.Length > 700 * 1024 * 1024)
        {
            return GetNextFileName(directory, baseFileName);
        }
    }
    
    return latestFile;
}

// 取得下一個檔案名稱
static string GetNextFileName(string directory, string baseFileName)
{
    var files = Directory.GetFiles(directory, $"{baseFileName}_*.json");
    int maxNumber = 0;
    
    foreach (var file in files)
    {
        string fileName = Path.GetFileNameWithoutExtension(file);
        string[] parts = fileName.Split('_');
        if (parts.Length >= 3 && int.TryParse(parts[2], out int number))
        {
            maxNumber = Math.Max(maxNumber, number);
        }
    }
    
    return $"{baseFileName}_{(maxNumber + 1):D3}.json";
}

// 更新檔案清單 (用於網頁讀取)
static void UpdateFilesManifest(string directory, string baseFileName)
{
    try
    {
        var files = Directory.GetFiles(directory, $"{baseFileName}_*.json")
                            .Select(Path.GetFileName)
                            .OrderBy(f => f)
                            .ToList();
        
        var manifest = new { files = files };
        string manifestPath = Path.Combine(directory, "files.json");
        string manifestJson = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(manifestPath, manifestJson);
        Console.WriteLine($"已更新檔案清單: files.json (共 {files.Count} 個檔案)");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"警告: 無法更新 files.json - {ex.Message}");
    }
}