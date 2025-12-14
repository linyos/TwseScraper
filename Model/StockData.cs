using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TwseScraper.Model
{
    public class StockData
    {
        [JsonPropertyName("Code")]
        public string? Code { get; set; }

        [JsonPropertyName("Name")]
        public string? Name { get; set; }

        [JsonPropertyName("ClosingPrice")]
        public string? ClosingPrice { get; set; } // 注意: API 價格有時會回傳字串
    }
}