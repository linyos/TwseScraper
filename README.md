# 台積電股價監控 🚀

這是一個自動化的股票資料收集和展示系統，專門監控台積電（2330）的股價資訊。

## 🌟 功能特色

- 📊 **即時資料收集**: 自動從台灣證券交易所 API 抓取股價
- 💾 **智能儲存**: 支援大檔案自動分割 (700MB 限制)
- 📈 **視覺化展示**: 互動式圖表和統計資料
- 🌐 **GitHub Pages**: 線上查看股價趨勢

## 🎯 專案結構

```
TwseScraper/
├── Program.cs              # 主程式 - 資料收集邏輯
├── Model/
│   ├── StockData.cs        # API 回應資料模型
│   └── SavedData.cs        # 儲存資料模型
├── data/
│   └── stock_2330_*.json   # 股價資料檔案
├── index.html              # 網頁主頁
├── styles.css              # 樣式設計
├── script.js               # 前端互動邏輯
└── README.md               # 專案說明
```

## 🚀 快速開始

### 本地執行

1. **克隆專案**
   ```bash
   git clone https://github.com/linyos/TwseScraper.git
   cd TwseScraper
   ```

2. **執行資料收集**
   ```bash
   dotnet run
   ```

3. **查看網頁** (本地開發)
   - 直接打開 `index.html` 或
   - 使用本地伺服器：`python -m http.server 8000`

### GitHub Pages 部署

1. **設定 GitHub Pages**
   - 進入專案的 Settings → Pages
   - Source 選擇 "Deploy from a branch"
   - Branch 選擇 `main` / `(root)`

2. **訪問網站**
   - URL: `https://linyos.github.io/TwseScraper`

## 📊 資料格式

### 輸入資料 (台證所 API)
```json
{
  "Code": "2330",
  "Name": "台積電",
  "ClosingPrice": "1450.00"
}
```

### 儲存格式
```json
[
  {
    "Date": "2025-12-16",
    "StockNo": "2330", 
    "Price": "1450.00"
  }
]
```

### 檔案清單格式 (data/files.json)
用於網頁讀取可用的資料檔案列表：
```json
{
  "files": [
    "stock_2330_001.json",
    "stock_2330_002.json"
  ]
}
```


## 🔧 核心功能

### 1. 自動資料收集
- 每日自動抓取台積電股價
- 時區轉換 (UTC → 台北標準時間)
- 錯誤處理和重試機制

### 2. 智能檔案管理
- 資料累積到同一檔案
- 檔案大小超過 700MB 自動分割
- 檔案命名: `stock_2330_001.json`, `stock_2330_002.json`...
- **重要**: 新增檔案後需更新 `data/files.json` 清單以支援網頁讀取

### 3. 網頁展示
- 📈 即時股價圖表 (Chart.js)
- 📊 統計資訊卡片
- 📋 詳細資料表格
- 📱 響應式設計

## 🤖 GitHub Actions (建議)

可以設定自動化工作流程：

```yaml
name: Update Stock Data
on:
  schedule:
    - cron: '0 8 * * 1-5'  # 週一到週五早上8點執行
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: 8.0.x
      - name: Run scraper
        run: dotnet run
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/
          git diff --staged --quiet || git commit -m "Update stock data $(date)"
          git push
```

## 🌐 線上展示

訪問 GitHub Pages 查看即時資料：
**https://linyos.github.io/TwseScraper**

## 📱 功能展示

- ✅ 最新股價和變化趨勢
- ✅ 歷史資料圖表展示  
- ✅ **月份篩選器** - 依月份篩選圖表資料
- ✅ 資料筆數統計
- ✅ 檔案選擇和重新整理
- ✅ 響應式行動裝置支援
- ✅ 優雅的載入動畫

### 月份篩選功能

新增的月份篩選器位於股價走勢圖區段，允許使用者：
- 依特定月份查看股價資料
- 自動從載入的資料中提取可用月份
- 預設選擇最新月份，避免顯示過多資料
- 選擇「所有月份」可查看完整資料集
- 篩選會同步更新圖表、統計資訊和資料表格

**使用方式**:
1. 從「選擇資料檔案」下拉選單選擇資料檔
2. 資料載入後，月份篩選器會自動填充可用月份
3. 預設顯示最新月份的資料
4. 點擊月份篩選器選擇其他月份或「所有月份」
5. 圖表、統計和表格會即時更新

## 🛠 技術棧

**後端資料收集**:
- C# / .NET 8.0
- System.Text.Json
- HttpClient

**前端展示**:
- HTML5 / CSS3 / JavaScript
- Chart.js (圖表庫)
- 響應式設計

**部署平台**:
- GitHub Pages
- GitHub Actions (可選)

## 📄 授權

MIT License - 自由使用和修改

---

🤖 **自動更新** | 📊 **即時監控** | 🚀 **持續優化**