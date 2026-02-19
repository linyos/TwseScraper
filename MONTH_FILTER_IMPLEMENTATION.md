# 月份篩選器實作說明

## 概述

此文件說明股價走勢圖月份篩選器的實作細節，以便未來維護和擴展。

## 功能說明

月份篩選器允許使用者依月份檢視股價資料，避免在圖表上一次顯示過多資料點。使用者可以：

1. 選擇特定月份查看該月的股價走勢
2. 選擇「所有月份」查看完整資料集
3. 在不同月份間切換，圖表和統計資訊會即時更新

## 檔案修改清單

### 1. index.html
**修改位置**: 第 68-82 行（股價走勢圖區段）

**修改內容**:
- 在 `.section-header` 中新增 `.chart-controls` 容器
- 新增月份篩選器 `<select id="monthFilter">`
- 添加 tooltip: `title="選擇月份以篩選圖表資料"`
- 將原本的 `.live-indicator` 移入 `.chart-controls` 容器

### 2. script.js
**新增全域變數**:
- `filteredData`: 儲存篩選後的資料
- `selectedMonth`: 當前選擇的月份 (格式: YYYY-MM)

**新增函數**:
1. `getDisplayData()` (第 187-192 行)
   - 輔助函數，統一回傳要顯示的資料集
   - 避免程式碼重複

2. `isValidDateFormat(dateStr)` (第 194-204 行)
   - 驗證日期格式是否為 YYYY-MM-DD
   - 防止無效日期導致錯誤

3. `populateMonthFilter()` (第 206-266 行)
   - 從 allData 提取唯一的年月組合
   - 填充月份篩選器選項
   - 預設選擇最新月份
   - 包含日期格式驗證

4. `handleMonthFilterChange(event)` (第 268-277 行)
   - 處理使用者的月份選擇變更
   - 更新所有相關顯示（圖表、統計、表格）

5. `applyMonthFilter()` (第 279-297 行)
   - 根據選擇的月份篩選資料
   - 將結果存入 filteredData
   - 包含日期格式驗證

**修改函數**:
- `loadDataFromFile()`: 新增月份篩選器初始化
- `updateStatistics()`: 改用 `getDisplayData()`
- `updateChart()`: 改用 `getDisplayData()`
- `updateTable()`: 改用 `getDisplayData()`

### 3. styles.css
**新增樣式** (第 419-465 行):
- `.chart-controls`: 圖表控制區域容器
- `.month-filter-wrapper`: 月份篩選器包裝容器
- `#monthFilter`: 月份篩選器的樣式（包含 hover 和 focus 狀態）

**修改樣式**:
- `.section-header`: 新增 `flex-wrap: wrap` 和 `gap: 15px` 以支援響應式佈局
- 響應式設計區段新增 `.chart-controls` 和 `.month-filter-wrapper` 的手機版樣式

### 4. README.md
**新增內容** (第 147-162 行):
- 在功能展示區段新增月份篩選器說明
- 詳細的使用方式說明

## 資料流程

```
1. 使用者選擇資料檔案
   ↓
2. loadDataFromFile() 載入資料到 allData
   ↓
3. populateMonthFilter() 提取可用月份並填充下拉選單
   ↓
4. 預設選擇最新月份，設定 selectedMonth
   ↓
5. applyMonthFilter() 篩選資料到 filteredData
   ↓
6. updateStatistics(), updateChart(), updateTable() 
   使用 getDisplayData() 取得 filteredData 並顯示
   ↓
7. 使用者變更月份選擇
   ↓
8. handleMonthFilterChange() 觸發
   ↓
9. 重複步驟 5-6
```

## 設計決策

### 1. 預設選擇最新月份
**原因**: 避免在圖表上一次顯示過多資料點，造成視覺混亂

**實作**: 在 `populateMonthFilter()` 中，自動選擇排序後的最後一個月份

### 2. 使用 filteredData 而非修改 allData
**原因**: 
- 保持原始資料完整性
- 便於在不同篩選條件間切換
- 支援未來可能的多重篩選功能

### 3. 月份格式使用 YYYY-MM
**原因**:
- 與 ISO 8601 日期格式相容
- 易於排序和比對
- 簡化字串比對邏輯（使用 `startsWith()`）

### 4. 新增日期格式驗證
**原因**:
- 防止無效日期造成程式錯誤
- 提供清楚的錯誤訊息（console.warn）
- 確保資料品質

## 如何擴展此功能

### 改為季度篩選

修改 `populateMonthFilter()`:
```javascript
// 將月份轉換為季度
const quarter = Math.ceil((date.getMonth() + 1) / 3);
const yearQuarter = `${date.getFullYear()}-Q${quarter}`;
monthsSet.add(yearQuarter);

// 顯示文字改為: 2026年Q1
option.textContent = `${year}年Q${quarter}`;
```

修改 `applyMonthFilter()`:
```javascript
filteredData = allData.filter(item => {
    const date = new Date(item.Date);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    const itemQuarter = `${date.getFullYear()}-Q${quarter}`;
    return itemQuarter === selectedMonth;
});
```

### 新增年份篩選器

可以仿照月份篩選器的架構，新增：
1. 另一個 `<select id="yearFilter">` 元素
2. `populateYearFilter()` 函數
3. `handleYearFilterChange()` 事件處理器
4. 修改 `applyMonthFilter()` 支援雙重篩選

## 測試結果

使用範例資料進行測試，包含三個月份的資料：
- 2025年12月: 13 筆資料
- 2026年01月: 22 筆資料
- 2026年02月: 14 筆資料
- 總計: 49 筆資料

所有篩選選項均正常運作：
- ✅ 選擇特定月份時，只顯示該月資料
- ✅ 選擇「所有月份」時，顯示全部資料
- ✅ 統計資訊正確反映篩選後的資料
- ✅ 圖表正確更新（在有 Chart.js 的環境下）
- ✅ 表格正確顯示篩選後的資料
- ✅ 日期格式驗證正常運作
- ✅ 無安全漏洞（通過 CodeQL 檢查）

## 已知限制

1. **Chart.js CDN 依賴**: 圖表功能需要從 CDN 載入 Chart.js。如果 CDN 不可用，圖表不會顯示，但其他功能（統計、表格）仍正常運作。

2. **瀏覽器相容性**: 使用現代 JavaScript 功能（Set, Array.from, filter, map 等），需要較新的瀏覽器支援。

## 維護建議

1. **定期測試**: 當新增資料跨越多個月份時，測試月份篩選器是否正確運作
2. **效能監控**: 如果資料量非常大（數千筆），考慮優化篩選邏輯或加入分頁
3. **使用者回饋**: 收集使用者對篩選功能的回饋，考慮新增更多篩選選項（如日期範圍、自訂區間等）
