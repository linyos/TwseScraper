/**
 * TSMC 2330 股價監控系統 - 主要腳本
 * 
 * 功能概述:
 * - 從 JSON 檔案載入 TSMC 股票價格資料
 * - 使用 Chart.js 顯示互動式股價走勢圖
 * - 提供月份篩選功能，允許使用者查看特定月份的資料
 * - 即時更新統計資訊（最新價格、資料筆數、價格趨勢）
 * - 顯示詳細的資料表格，包含每日價格變化
 * 
 * 月份篩選器功能:
 * - 位於股價走勢圖區段的右上角
 * - 自動從載入的資料中提取可用的月份
 * - 預設選擇最新的月份
 * - 選擇不同月份時，會動態更新圖表、統計和表格
 * - 選擇 "所有月份" 會顯示完整的資料集
 * 
 * 如何維護月份篩選器:
 * 1. populateMonthFilter(): 負責填充月份選項，在載入新檔案時自動執行
 * 2. handleMonthFilterChange(): 處理使用者的月份選擇變更
 * 3. applyMonthFilter(): 執行實際的資料篩選邏輯
 * 4. 所有顯示函數（updateChart, updateStatistics, updateTable）都使用 filteredData
 * 
 * 如果需要修改篩選邏輯（例如改為季度篩選），請修改 populateMonthFilter() 
 * 和 applyMonthFilter() 函數中的邏輯。
 */

// 全域變數
let allData = []; // 儲存從檔案載入的完整資料集
let filteredData = []; // 儲存根據月份篩選後的資料（用於圖表、統計和表格顯示）
let chart = null; // Chart.js 圖表實例
let selectedMonth = ''; // 當前選擇的月份（格式: YYYY-MM，例如 "2026-01"）

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    addEnhancedEffects();
});

// 初始化頁面
function initializePage() {
    loadAvailableFiles();
    setupEventListeners();
}

// 設定事件監聽器
function setupEventListeners() {
    document.getElementById('fileSelector').addEventListener('change', handleFileChange);
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    document.getElementById('monthFilter').addEventListener('change', handleMonthFilterChange);
}

// 添加增強視覺效果
function addEnhancedEffects() {
    // 添加卡片進入動畫
    const cards = document.querySelectorAll('.stat-card, .chart-section, .data-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
}

// 數字動畫效果
function animateNumber(element, targetValue, duration = 1000, isPrice = false) {
    const startValue = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const difference = targetValue - startValue;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用緩動函數
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (difference * easeOutQuart);
        
        if (isPrice) {
            element.textContent = `$${currentValue.toFixed(2)}`;
        } else {
            element.textContent = Math.floor(currentValue).toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (isPrice) {
                element.textContent = `$${targetValue.toFixed(2)}`;
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        }
    }
    
    requestAnimationFrame(update);
}

// 載入可用的檔案列表
async function loadAvailableFiles() {
    try {
        const response = await fetch('./data/files.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const manifest = await response.json();
        const files = manifest.files || [];
        populateFileSelector(files);
    } catch (error) {
        console.error('無法載入檔案列表:', error);
        showError('無法存取 data/files.json 清單檔案');
    }
}

// 填充檔案選擇器
function populateFileSelector(files) {
    const selector = document.getElementById('fileSelector');
    selector.innerHTML = '<option value="">選擇資料檔案...</option>';
    
    if (files.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "無可用的資料檔案";
        option.disabled = true;
        selector.appendChild(option);
        showError('data/ 目錄中沒有找到股票資料檔案');
        return;
    }
    
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        selector.appendChild(option);
    });
    
    // 自動選擇最新的檔案
    if (files.length > 0) {
        selector.value = files[files.length - 1];
        loadDataFromFile(files[files.length - 1]);
    }
}

// 處理檔案選擇變更
function handleFileChange(event) {
    const selectedFile = event.target.value;
    if (selectedFile) {
        loadDataFromFile(selectedFile);
    }
}

// 從檔案載入資料
async function loadDataFromFile(fileName) {
    try {
        showLoading(true);
        const response = await fetch(`./data/${fileName}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allData = Array.isArray(data) ? data : [data];
        
        // 重置月份篩選器並填充可用月份
        populateMonthFilter();
        
        // 應用當前的月份篩選
        applyMonthFilter();
        
        updateStatistics();
        updateChart();
        updateTable();
        
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        showError('無法載入資料檔案: ' + fileName);
    } finally {
        showLoading(false);
    }
}

// 獲取要顯示的資料集
// 統一的輔助函數，用於決定應該使用 filteredData 還是 allData
// 如果有篩選後的資料就使用篩選後的，否則使用全部資料
function getDisplayData() {
    return filteredData.length > 0 ? filteredData : allData;
}

// 驗證日期格式是否為 YYYY-MM-DD
// 返回 true 如果格式正確，否則返回 false
function isValidDateFormat(dateStr) {
    if (typeof dateStr !== 'string') return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    
    // 進一步驗證日期是否有效
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

// 填充月份篩選器選項
// 此函數會從 allData 中提取所有唯一的年月組合，並填充到月份篩選器中
// 預設會選擇最新的月份，或保留使用者之前的選擇（如果仍然有效）
function populateMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    
    // 保存當前選擇的月份（在重新載入時保持使用者的選擇）
    const currentSelection = monthFilter.value;
    
    // 清空並重置為預設選項
    monthFilter.innerHTML = '<option value="">所有月份</option>';
    
    if (allData.length === 0) {
        return;
    }
    
    // 提取所有唯一的年月組合並排序
    const monthsSet = new Set();
    allData.forEach(item => {
        // 驗證日期格式
        if (!isValidDateFormat(item.Date)) {
            console.warn(`無效的日期格式: ${item.Date}`);
            return;
        }
        
        const date = new Date(item.Date);
        // 確保日期物件有效
        if (isNaN(date.getTime())) {
            console.warn(`無法解析日期: ${item.Date}`);
            return;
        }
        
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(yearMonth);
    });
    
    const months = Array.from(monthsSet).sort();
    
    // 為每個月份創建選項
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        
        // 格式化顯示文字: YYYY年MM月
        const [year, monthNum] = month.split('-');
        option.textContent = `${year}年${monthNum}月`;
        
        monthFilter.appendChild(option);
    });
    
    // 恢復之前的選擇（如果仍然有效）
    if (currentSelection && months.includes(currentSelection)) {
        monthFilter.value = currentSelection;
        selectedMonth = currentSelection;
    } else if (months.length > 0) {
        // 預設選擇最新的月份（以便使用者看到最近的資料）
        const latestMonth = months[months.length - 1];
        monthFilter.value = latestMonth;
        selectedMonth = latestMonth;
    }
}

// 處理月份篩選器變更事件
// 當使用者從下拉選單選擇不同的月份時，此函數會被觸發
// 它會更新篩選後的資料，並重新渲染圖表、統計資訊和表格
function handleMonthFilterChange(event) {
    selectedMonth = event.target.value;
    applyMonthFilter();
    updateStatistics();
    updateChart();
    updateTable();
}

// 應用月份篩選邏輯
// 根據 selectedMonth 的值篩選 allData，將結果存入 filteredData
// - 如果 selectedMonth 為空字串，表示選擇了 "所有月份"，顯示全部資料
// - 否則，只顯示符合選定月份的資料項目
// - 使用日期格式驗證確保資料正確性
function applyMonthFilter() {
    if (!selectedMonth) {
        // 如果沒有選擇月份，顯示所有資料
        filteredData = [...allData];
    } else {
        // 篩選出選定月份的資料
        // 驗證日期格式並確保只篩選有效的資料項目
        filteredData = allData.filter(item => {
            // 確保 Date 屬性存在且為字串格式
            if (typeof item.Date !== 'string') {
                console.warn(`資料項目的日期不是字串格式:`, item);
                return false;
            }
            
            // 比對日期字串的前綴 (YYYY-MM)
            return item.Date.startsWith(selectedMonth);
        });
    }
}





// 更新統計資料
function updateStatistics() {
    // 使用輔助函數獲取要顯示的資料集
    const dataToUse = getDisplayData();
    
    if (dataToUse.length === 0) return;
    
    const latest = dataToUse[dataToUse.length - 1];
    const previous = dataToUse.length > 1 ? dataToUse[dataToUse.length - 2] : null;
    
    // 最新價格（使用動畫）
    const priceElement = document.getElementById('latestPrice');
    const targetPrice = parseFloat(latest.Price);
    animateNumber(priceElement, targetPrice, 800, true);
    document.getElementById('latestDate').textContent = latest.Date;
    
    // 資料筆數（使用動畫）- 顯示篩選後的資料筆數
    const countElement = document.getElementById('dataCount');
    animateNumber(countElement, dataToUse.length, 800, false);
    
    // 價格趨勢
    if (previous) {
        const currentPrice = parseFloat(latest.Price);
        const previousPrice = parseFloat(previous.Price);
        const change = currentPrice - previousPrice;
        const changePercent = ((change / previousPrice) * 100).toFixed(2);
        
        const trendElement = document.getElementById('priceTrend');
        const trendDescElement = document.getElementById('trendDesc');
        
        if (change > 0) {
            trendElement.textContent = `+${change.toFixed(2)}`;
            trendElement.className = 'trend up';
            trendDescElement.textContent = `上漲 ${changePercent}%`;
        } else if (change < 0) {
            trendElement.textContent = change.toFixed(2);
            trendElement.className = 'trend down';
            trendDescElement.textContent = `下跌 ${Math.abs(changePercent)}%`;
        } else {
            trendElement.textContent = '0.00';
            trendElement.className = 'trend neutral';
            trendDescElement.textContent = '持平';
        }
    } else {
        document.getElementById('priceTrend').textContent = '-';
        document.getElementById('trendDesc').textContent = '無比較資料';
    }
    
    // 最後更新時間
    const now = new Date();
    const updateTime = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    document.getElementById('lastUpdate').textContent = updateTime;
    document.getElementById('footerUpdate').textContent = updateTime;
}

// 更新圖表
function updateChart() {
    // 檢查 Chart.js 是否已載入
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js 尚未載入，跳過圖表更新');
        return;
    }
    
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    // 使用輔助函數獲取要顯示的資料集
    const dataToUse = getDisplayData();
    const labels = dataToUse.map(item => item.Date);
    const prices = dataToUse.map(item => parseFloat(item.Price));
    
    // 創建漸層
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 128, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 128, 255, 0.05)');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'TSMC 2330 股價 (TWD)',
                data: prices,
                borderColor: '#00f5ff',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f5ff',
                pointBorderColor: '#0a0e27',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#00f5ff',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#8b92a7',
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 31, 58, 0.95)',
                    titleColor: '#00f5ff',
                    bodyColor: '#e0e6ed',
                    borderColor: '#00f5ff',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    titleFont: {
                        family: "'JetBrains Mono', monospace",
                        size: 13
                    },
                    bodyFont: {
                        family: "'JetBrains Mono', monospace",
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            return `股價: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期',
                        color: '#8b92a7',
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 245, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#8b92a7',
                        font: {
                            family: "'JetBrains Mono', monospace",
                            size: 10
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '股價 (TWD)',
                        color: '#8b92a7',
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 245, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#8b92a7',
                        font: {
                            family: "'JetBrains Mono', monospace",
                            size: 10
                        },
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// 更新表格
function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // 使用輔助函數獲取要顯示的資料集
    const dataToUse = getDisplayData();
    
    if (dataToUse.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">無資料可顯示</td></tr>';
        return;
    }
    
    // 反向顯示 (最新的在前)
    const reversedData = [...dataToUse].reverse();
    
    reversedData.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // 添加進入動畫
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, index * 30); // 階梯式動畫
        
        // 計算價格變化
        let changeCell = '-';
        if (index < reversedData.length - 1) {
            const current = parseFloat(item.Price);
            const previous = parseFloat(reversedData[index + 1].Price);
            const change = current - previous;
            
            if (change !== 0) {
                const changePercent = ((change / previous) * 100).toFixed(2);
                const changeClass = change > 0 ? 'price-up' : 'price-down';
                const changeSymbol = change > 0 ? '+' : '';
                const changeIcon = change > 0 ? '▲' : '▼';
                changeCell = `<span class="price-change ${changeClass}">
                    ${changeIcon} ${changeSymbol}${change.toFixed(2)} (${changeSymbol}${changePercent}%)
                </span>`;
            } else {
                changeCell = '<span class="price-change price-neutral">● 0.00 (0.00%)</span>';
            }
        }
        
        row.innerHTML = `
            <td>${item.Date}</td>
            <td>${item.StockNo}</td>
            <td>$${parseFloat(item.Price).toFixed(2)}</td>
            <td>${changeCell}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// 重新整理資料
function refreshData() {
    const selectedFile = document.getElementById('fileSelector').value;
    if (selectedFile) {
        // 保持當前選擇的月份
        loadDataFromFile(selectedFile);
    } else {
        loadAvailableFiles();
    }
}

// 顯示載入狀態
function showLoading(show) {
    const elements = [
        { id: 'latestPrice', loading: '載入中...' },
        { id: 'dataCount', loading: '載入中...' },
        { id: 'priceTrend', loading: '載入中...' },
        { id: 'lastUpdate', loading: '載入中...' }
    ];
    
    elements.forEach(item => {
        const element = document.getElementById(item.id);
        if (show) {
            element.textContent = item.loading;
            element.classList.add('loading-spinner');
        } else {
            element.classList.remove('loading-spinner');
        }
    });
    
    if (show) {
        document.getElementById('tableBody').innerHTML = 
            '<tr><td colspan="4" class="loading loading-spinner">載入資料中...</td></tr>';
    }
}

// 顯示錯誤訊息
function showError(message) {
    console.error(message);
    
    document.getElementById('latestPrice').textContent = 'ERROR';
    document.getElementById('latestPrice').style.color = 'var(--neon-pink)';
    document.getElementById('dataCount').textContent = '0';
    document.getElementById('priceTrend').textContent = '-';
    document.getElementById('lastUpdate').textContent = '載入失敗';
    
    document.getElementById('tableBody').innerHTML = 
        `<tr><td colspan="4" class="loading" style="color: var(--neon-pink);">
            <strong>⚠ 載入失敗</strong><br><small>${message}</small>
        </td></tr>`;
}