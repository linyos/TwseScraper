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
            var dataToSave = new SavedData
                {
                    Date = twTime.ToString("yyyy-MM-dd"),
                    StockNo = tsmcData.Code,
                    Price = tsmcData.ClosingPrice
                };
            // 5. 確保 data 資料夾存在
                string outputDir = "data";
                if (!Directory.Exists(outputDir)) Directory.CreateDirectory(outputDir);

                // 6. 寫入檔案 (檔名: stock_2330_20231212.json)
                string fileName = Path.Combine(outputDir, $"stock_{targetStock}_{twTime:yyyyMMdd}.json");
                string jsonString = JsonSerializer.Serialize(dataToSave, new JsonSerializerOptions { WriteIndented = true });
                
                await File.WriteAllTextAsync(fileName, jsonString);
                Console.WriteLine($"檔案已儲存: {fileName}");
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