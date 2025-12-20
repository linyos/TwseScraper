// 全域變數
let allData = [];
let chart = null;

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
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
}

// 載入可用的檔案列表
async function loadAvailableFiles() {
    try {
        const response = await fetch('./data/');
        if (response.ok) {
            const text = await response.text();
            // 簡單解析目錄列表 (這在實際 GitHub Pages 可能需要調整)
            const files = parseDirectoryListing(text);
            populateFileSelector(files);
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('無法載入檔案列表:', error);
        showError('無法存取 data/ 目錄');
    }
}

// 解析目錄列表 (簡化版本)
function parseDirectoryListing(html) {
    const files = [];
    const regex = /stock_2330_\d{3}\.json/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        files.push(match[0]);
    }
    return files.sort();
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





// 更新統計資料
function updateStatistics() {
    if (allData.length === 0) return;
    
    const latest = allData[allData.length - 1];
    const previous = allData.length > 1 ? allData[allData.length - 2] : null;
    
    // 最新價格
    document.getElementById('latestPrice').textContent = `$${latest.Price}`;
    document.getElementById('latestDate').textContent = latest.Date;
    
    // 資料筆數
    document.getElementById('dataCount').textContent = allData.length.toLocaleString();
    
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
    const updateTime = now.toLocaleString('zh-TW');
    document.getElementById('lastUpdate').textContent = updateTime;
    document.getElementById('footerUpdate').textContent = updateTime;
}

// 更新圖表
function updateChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    const labels = allData.map(item => item.Date);
    const prices = allData.map(item => parseFloat(item.Price));
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '台積電股價 (TWD)',
                data: prices,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2196F3',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '台積電股價走勢',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '股價 (TWD)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 更新表格
function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (allData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">無資料可顯示</td></tr>';
        return;
    }
    
    // 反向顯示 (最新的在前)
    const reversedData = [...allData].reverse();
    
    reversedData.forEach((item, index) => {
        const row = document.createElement('tr');
        
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
                changeCell = `<span class="price-change ${changeClass}">
                    ${changeSymbol}${change.toFixed(2)} (${changeSymbol}${changePercent}%)
                </span>`;
            } else {
                changeCell = '<span class="price-change price-neutral">0.00 (0.00%)</span>';
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
        loadDataFromFile(selectedFile);
    } else {
        loadAvailableFiles();
    }
}

// 顯示載入狀態
function showLoading(show) {
    const elements = [
        'latestPrice', 'dataCount', 'priceTrend', 'lastUpdate'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (show) {
            element.textContent = '載入中...';
            element.classList.add('loading-spinner');
        } else {
            element.classList.remove('loading-spinner');
        }
    });
    
    if (show) {
        document.getElementById('tableBody').innerHTML = 
            '<tr><td colspan="4" class="loading loading-spinner">載入中...</td></tr>';
    }
}

// 顯示錯誤訊息
function showError(message) {
    console.error(message);
    
    document.getElementById('latestPrice').textContent = '錯誤';
    document.getElementById('dataCount').textContent = '0';
    document.getElementById('priceTrend').textContent = '-';
    document.getElementById('lastUpdate').textContent = '載入失敗';
    
    document.getElementById('tableBody').innerHTML = 
        `<tr><td colspan="4" class="loading" style="color: #f44336;">載入失敗: ${message}</td></tr>`;
}