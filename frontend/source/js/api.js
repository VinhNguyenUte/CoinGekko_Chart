// js/api.js

// Giả lập độ trễ mạng
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. API: Lấy dữ liệu Heatmap
export async function getCorrelationData(timeframe) {
    await delay(500); 
    return {
        labels: ["BTC", "ETH", "BNB", "SOL", "USDT"],
        z_values: [
            [1.0, 0.87, 0.72, 0.81, -0.12],
            [0.87, 1.0, 0.68, 0.79, -0.08],
            [0.72, 0.68, 1.0, 0.65, -0.15],
            [0.81, 0.79, 0.65, 1.0, -0.05],
            [-0.12, -0.08, -0.15, -0.05, 1.0],
        ]
    };
}

// 2. API: Lấy dữ liệu chi tiết Coin
export async function getCoinAnalysisData(coinSymbol, timeframe) {
    await delay(800); 

    // Tạo dữ liệu giả
    const count = 30;
    const dates = Array.from({length: count}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (count - 1 - i));
        return d.toISOString().split('T')[0];
    });

    // Tạo giá giả lập
    const prices = dates.map(i => 90000 + Math.random() * 5000);
    
    // --- KHẮC PHỤC LỖI Ở ĐÂY: TÍNH TOÁN BOLLINGER BANDS GIẢ ---
    const ma = prices.map(p => p - 200 + Math.random() * 400); // MA loanh quanh giá
    const stdDev = 2000; // Giả sử độ lệch chuẩn là 2000$

    return {
        coin: coinSymbol,
        
        // Data cho Line Chart
        lineData: {
            dates: dates,
            prices: prices,
            ma: ma,
            
            // >>> THÊM MỚI PHẦN NÀY ĐỂ HẾT LỖI <<<
            boll: {
                upper: ma.map(v => v + (2 * stdDev)), // Dải trên
                lower: ma.map(v => v - (2 * stdDev))  // Dải dưới
            },
            
            // Dữ liệu khác
            rsi: dates.map(() => 30 + Math.random() * 40), // RSI từ 30-70
            dpo: dates.map(i => Math.sin(Math.random() * 10) * 2000),
            forecast: {
                date: "Tomorrow",
                price: prices[prices.length - 1] + 500 // Dự báo tăng nhẹ
            }
        },

        // Data cho Scatter
        scatterData: {
            points: Array.from({length: 30}, () => ({
                volume: Math.floor(Math.random() * 50) + 10,
                change: (Math.random() - 0.5) * 10,
                date: "2023-xx-xx"
            })),
            trendline: { slope: 0.05, intercept: 0.2 }
        },

        // Data cho Histogram
        histogramData: {
            returns: Array.from({length: 100}, () => (Math.random() - 0.5) * 8),
            stats: { mean: 0.2, std_dev: 2.5, max_drawdown: -15.5 }
        },

        // Data cho Signal
        signalData: {
            signal: "STRONG BUY",
            score: 85,
            factors: ["RSI < 30 (Oversold)", "Price > MA20", "DPO Crossover"]
        }
    };
}