// js/main.js

// 1. IMPORT CÁC HÀM VẼ TỪ CÁC FILE RIÊNG LẺ
// (Lưu ý: Phải có đuôi .js trong đường dẫn import)
import { renderCorrelationHeatmap } from './charts/heatmap.js';
import { renderPriceTrendChart } from './charts/lineChart.js';
import { renderScatterPlot } from './charts/scatterChart.js';
import { renderRiskHistogram } from './charts/histogram.js';

// 2. IMPORT API
import { getCorrelationData, getCoinAnalysisData } from './api.js';

// --- STATE ---
let currentCoin = 'BTC';
let currentTimeframe = '1M';

// =========================================================
// LOGIC ĐIỀU PHỐI (CONTROLLER LOGIC)
// =========================================================

// Hàm tải Dashboard (Chỉ gọi API Heatmap và ném data cho heatmap.js vẽ)
async function loadDashboard() {
    console.log("Loading Dashboard...");
    const data = await getCorrelationData(currentTimeframe);
    
    if (data) {
        // Main.js không biết vẽ, nó nhờ heatmap.js vẽ
        renderCorrelationHeatmap(data); 
    }
}

// Hàm tải Analysis (Chỉ gọi API Coin và ném data cho các chart con vẽ)
async function loadAnalysis() {
    console.log(`Loading Analysis for ${currentCoin}...`);
    const data = await getCoinAnalysisData(currentCoin, currentTimeframe);
    
    if (data) {
        // Cập nhật Header (Tên coin, giá...)
        updateHeaderUI(data.coin, data.lineData.prices);
        updateSignalCard(data.signalData);

        // Phân phối dữ liệu cho từng "thợ vẽ"
        renderPriceTrendChart(data.lineData);       // lineChart.js lo
        renderScatterPlot(data.scatterData);        // scatterChart.js lo
        renderRiskHistogram(data.histogramData);    // histogram.js lo
        
        // (Nếu có Seasonal Chart riêng thì gọi ở đây)
        // renderSeasonalChart(data.lineData); 
    }
}

// --- CÁC HÀM UI HELPER (Có thể để trong main hoặc tách ra ui.js) ---

function updateHeaderUI(coinSymbol, prices) {
    const lastPrice = prices[prices.length - 1];
    document.querySelector('.coin-title').textContent = coinSymbol === 'BTC' ? 'Bitcoin' : coinSymbol;
    document.querySelector('.current-price').textContent = `$${lastPrice.toLocaleString()}`;
    // ... logic đổi màu giá ...
}

function updateSignalCard(signalData) {
    const el = document.querySelector('.signal-card.buy .signal-value');
    if (el) el.textContent = signalData.signal;
}

function switchView(viewName) {
    // 1. Lấy các phần tử DOM cần thiết
    const dashboardView = document.getElementById('view-dashboard');
    const analysisView = document.getElementById('view-analysis');
    
    // Lấy 2 nút menu bên trái
    const navDashboard = document.getElementById('nav-dashboard');
    const navAnalysis = document.getElementById('nav-analysis');

    // 2. Logic chuyển đổi
    if (viewName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        analysisView.classList.add('hidden');
            
        if(navDashboard) navDashboard.classList.add('active');
        if(navAnalysis) navAnalysis.classList.remove('active');
        
        // Resize lại chart
        if(window.Plotly) window.Plotly.Plots.resize('correlation-heatmap');
    } 
    else if (viewName === 'analysis') {
        dashboardView.classList.add('hidden');
        analysisView.classList.remove('hidden');
    
        if(navDashboard) navDashboard.classList.remove('active');
        if(navAnalysis) navAnalysis.classList.add('active');

        // Resize lại các chart con
        ['price-trend-chart', 'scatter-plot', 'risk-histogram', 'seasonal-chart'].forEach(id => {
            const el = document.getElementById(id);
            if(el && window.Plotly) window.Plotly.Plots.resize(el);
        });
    }
}

// =========================================================
// INIT & EVENT LISTENERS
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Load dữ liệu
    loadDashboard();
    loadAnalysis();

    // Sự kiện chuyển trang
    document.getElementById('nav-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard');
    });

    document.getElementById('nav-analysis').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('analysis');
    });

    // Sự kiện chọn Coin
    document.querySelectorAll('.coin-item').forEach(item => {
        item.addEventListener('click', async () => {
            // UI Active state
            document.querySelectorAll('.coin-item').forEach(c => c.classList.remove('active'));
            item.classList.add('active');

            // Logic thay đổi dữ liệu
            currentCoin = item.dataset.coin;
            await loadAnalysis();
            switchView('analysis');
        });
    });
    
    // Mặc định vào Dashboard
    switchView('dashboard');
});