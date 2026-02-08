// 全域變數
let allData = [];
let chart = null;

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
    
    // 最新價格（使用動畫）
    const priceElement = document.getElementById('latestPrice');
    const targetPrice = parseFloat(latest.Price);
    animateNumber(priceElement, targetPrice, 800, true);
    document.getElementById('latestDate').textContent = latest.Date;
    
    // 資料筆數（使用動畫）
    const countElement = document.getElementById('dataCount');
    animateNumber(countElement, allData.length, 800, false);
    
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
    
    const labels = allData.map(item => item.Date);
    const prices = allData.map(item => parseFloat(item.Price));
    
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
    
    if (allData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">無資料可顯示</td></tr>';
        return;
    }
    
    // 反向顯示 (最新的在前)
    const reversedData = [...allData].reverse();
    
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