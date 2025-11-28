// ========================================
// 1. PLOTLY CONFIGURATIONS
// ========================================
const Plotly = window.Plotly;

export const darkThemeLayout = {
    paper_bgcolor: "rgba(21, 28, 40, 0)",
    plot_bgcolor: "rgba(21, 28, 40, 0)",
    font: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#94a3b8",
        size: 12,
    },
    margin: { t: 30, r: 30, b: 50, l: 60 },
    xaxis: {
        gridcolor: "rgba(30, 41, 59, 0.5)",
        linecolor: "#1e293b",
        tickfont: { color: "#64748b" },
        zerolinecolor: "#1e293b",
    },
    yaxis: {
        gridcolor: "rgba(30, 41, 59, 0.5)",
        linecolor: "#1e293b",
        tickfont: { color: "#64748b" },
        zerolinecolor: "#1e293b",
    },
};

export const plotlyConfig = {
    displayModeBar: false, // Tắt thanh công cụ cho gọn
    responsive: true,
};

// ========================================
// 2. DATA FUNCTIONS (Dữ liệu giả lập)
// ========================================
function getCoinData(symbol) {
    const data = {
        BTC: { name: "Bitcoin", price: "$96,847.32", change: "+$2,341.56 (2.47%)", positive: true, signal: "STRONG BUY" },
        ETH: { name: "Ethereum", price: "$3,642.18", change: "+$65.23 (1.82%)", positive: true, signal: "BUY" },
        BNB: { name: "BNB", price: "$612.45", change: "-$3.15 (-0.51%)", positive: false, signal: "HOLD" },
        SOL: { name: "Solana", price: "$234.67", change: "+$11.62 (5.21%)", positive: true, signal: "STRONG BUY" },
        USDT: { name: "Tether", price: "$1.00", change: "$0.00 (0.00%)", positive: true, signal: "STABLE" },
    };
    return data[symbol] || data.BTC;
}

function updateDetailHeader(coinData) {
    const title = document.querySelector(".coin-title");
    const price = document.querySelector(".current-price");
    const change = document.querySelector(".price-change");
    const signalValue = document.querySelector(".signal-card.buy .signal-value");

    if (title) title.textContent = coinData.name;
    if (price) price.textContent = coinData.price;
    if (change) {
        change.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="change-icon" style="width:16px;height:16px">
                <polyline points="${coinData.positive ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}"></polyline>
            </svg>
            ${coinData.change}
        `;
        change.className = `price-change ${coinData.positive ? "positive" : "negative"}`;
    }
    // Update Signal text if element exists
    if (signalValue) signalValue.textContent = coinData.signal;
}

// ========================================
// 3. CHART RENDERING FUNCTIONS
// ========================================
import { renderCorrelationHeatmap } from "./individual_charts/correlationHeatmap.js";
import { renderPriceTrendChart } from "./individual_charts/priceTrendChart.js";
import { renderScatterPlot } from "./individual_charts/scatterPlot.js";
import { renderRiskHistogram } from "./individual_charts/riskHistogram.js";


// ========================================
// 4. NAVIGATION LOGIC (QUAN TRỌNG)
// ========================================
function switchView(viewName) {
    const dashboardView = document.getElementById('view-dashboard');
    const analysisView = document.getElementById('view-analysis');
    const navDashboard = document.getElementById('nav-dashboard');
    const navAnalysis = document.getElementById('nav-analysis');

    if (viewName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        analysisView.classList.add('hidden');
        
        navDashboard.classList.add('active');
        navAnalysis.classList.remove('active');
        
        Plotly.Plots.resize('correlation-heatmap');
    } 
    else if (viewName === 'analysis') {
        dashboardView.classList.add('hidden');
        analysisView.classList.remove('hidden');
        
        navDashboard.classList.remove('active');
        navAnalysis.classList.add('active');

        // Resize các chart con để tránh bị méo khi hiện ra
        ['price-trend-chart', 'scatter-plot', 'risk-histogram'].forEach(id => {
            const el = document.getElementById(id);
            if(el) Plotly.Plots.resize(el);
        });
    }
}

// ========================================
// 5. INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Render tất cả biểu đồ (Dù đang ẩn hay hiện)
    renderCorrelationHeatmap();
    renderPriceTrendChart();
    renderScatterPlot();
    renderRiskHistogram();

    // 2. Gán sự kiện Click cho Menu
    document.getElementById('nav-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard');
    });

    document.getElementById('nav-analysis').addEventListener('click', (e) => {
        e.preventDefault();
        switchView('analysis');
    });

    // 3. Gán sự kiện Click cho Coin List
    const coinItems = document.querySelectorAll('.coin-item');
    coinItems.forEach((item) => {
        item.addEventListener('click', () => {
            // Highlight coin được chọn
            coinItems.forEach(ci => ci.classList.remove('active'));
            item.classList.add('active');

            // Cập nhật dữ liệu
            const coinData = getCoinData(item.dataset.coin);
            updateDetailHeader(coinData);

            // Chuyển sang trang Analysis
            switchView('analysis'); 
        });
    });

    // 4. Mặc định vào Dashboard
    switchView('dashboard');
});