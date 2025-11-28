import { commonLayout, plotlyConfig, themeColors } from '../config.js';

/**
 * Hàm vẽ Chart 1: Price Trend & Prediction
 * Bao gồm: Price, MA, Bollinger Bands, Forecast, RSI
 */
export function renderPriceTrendChart(lineData) {
    // 1. Kiểm tra dữ liệu đầu vào
    if (!lineData || !lineData.dates) {
        console.warn("LineChart: No data received");
        return;
    }

    // --- TẦNG 1: PRICE, MA, BOLLINGER, FORECAST ---

    // 1.1. Bollinger Bands (Vẽ nền mờ)
    // Mẹo: Vẽ Band Trên (ẩn dòng) trước, sau đó vẽ Band Dưới và tô màu lấp đầy lên trên
    const traceBollUp = {
        x: lineData.dates,
        y: lineData.boll.upper,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 }, // Không hiện đường viền, chỉ dùng để định vị tô màu
        showlegend: false,
        hoverinfo: 'skip'
    };

    const traceBollLow = {
        x: lineData.dates,
        y: lineData.boll.lower,
        type: 'scatter',
        mode: 'lines',
        line: { width: 0 },
        fill: 'tonexty', // Tô màu từ đường này đến đường trước đó (BollUp)
        fillcolor: 'rgba(0, 212, 255, 0.1)', // Màu xanh nhạt mờ
        name: 'Bollinger Bands',
        hoverinfo: 'skip'
    };

    // 1.2. Đường Giá Chính (Price Line)
    const tracePrice = {
        x: lineData.dates,
        y: lineData.prices,
        type: 'scatter',
        mode: 'lines',
        name: 'Price',
        line: { color: themeColors.neonBlue, width: 2.5 }
    };

    // 1.3. Đường Xu Hướng (MA20)
    const traceMA = {
        x: lineData.dates,
        y: lineData.ma,
        type: 'scatter',
        mode: 'lines',
        name: 'MA20 (Trend)',
        line: { color: themeColors.neonYellow || '#fbbf24', width: 1.5 },
        opacity: 0.8
    };

    // 1.4. Đường Dự Báo (Forecast)
    // Logic: Lấy điểm cuối cùng của lịch sử nối với điểm dự báo
    const lastIndex = lineData.dates.length - 1;
    const traceForecast = {
        x: [lineData.dates[lastIndex], lineData.forecast.date],
        y: [lineData.prices[lastIndex], lineData.forecast.price],
        type: 'scatter',
        mode: 'lines+markers',
        name: 'AI Forecast',
        line: { 
            color: themeColors.neonRed || '#ff3366', 
            width: 2, 
            dash: 'dot' // Nét đứt
        },
        marker: { size: 6, symbol: 'diamond' }
    };

    // --- TẦNG 2: RSI (SUBPLOT) ---

    // 1.5. Đường RSI
    const traceRSI = {
        x: lineData.dates,
        y: lineData.rsi,
        type: 'scatter',
        mode: 'lines',
        name: 'RSI',
        line: { color: themeColors.neonPurple, width: 1.5 },
        yaxis: 'y2' // Quan trọng: Gán vào trục Y thứ 2
    };

    // 2. Cấu hình Layout (Subplots)
    const layout = {
        ...commonLayout, // Kế thừa layout chung
        
        // Cấu hình lưới (Grid) để chia 2 hàng
        grid: {
            rows: 2, 
            columns: 1, 
            roworder: 'top to bottom',
            pattern: 'independent'
        },

        // Trục Y1 (Giá): Chiếm 70% phía trên
        yaxis: {
            ...commonLayout.yaxis,
            domain: [0.35, 1], // Từ 35% đến 100% chiều cao
            title: 'Price ($)'
        },

        // Trục Y2 (RSI): Chiếm 25% phía dưới
        yaxis2: {
            ...commonLayout.yaxis,
            domain: [0, 0.25], // Từ 0% đến 25% chiều cao
            title: 'RSI',
            range: [0, 100],   // RSI luôn chạy từ 0-100
            tickvals: [30, 70], // Chỉ hiện số 30 và 70
            showgrid: true
        },

        // Trục X: Dùng chung, neo vào trục Y2 dưới cùng
        xaxis: {
            ...commonLayout.xaxis,
            anchor: 'y2' 
        },

        // Vẽ các đường kẻ ngang tham chiếu (Shapes) cho RSI
        shapes: [
            // Vạch 70 (Overbought)
            {
                type: 'line', xref: 'paper', x0: 0, x1: 1,
                yref: 'y2', y0: 70, y1: 70,
                line: { color: 'rgba(255, 51, 102, 0.5)', width: 1, dash: 'dot' }
            },
            // Vạch 30 (Oversold)
            {
                type: 'line', xref: 'paper', x0: 0, x1: 1,
                yref: 'y2', y0: 30, y1: 30,
                line: { color: 'rgba(0, 255, 136, 0.5)', width: 1, dash: 'dot' }
            }
        ],

        // Legend nằm ngang phía trên cùng
        legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center' },
        
        // Margin tùy chỉnh để không bị cắt chữ
        margin: { t: 50, r: 20, b: 40, l: 60 }
    };

    // 3. Vẽ biểu đồ
    // Gom tất cả traces vào một mảng
    const data = [traceBollUp, traceBollLow, tracePrice, traceMA, traceForecast, traceRSI];
    
    // Gọi Plotly toàn cục
    window.Plotly.newPlot("price-trend-chart", data, layout, plotlyConfig);
}