// js/charts/SeasonalChart.js

class SeasonalChart {
    // [SỬA] Nhận dữ liệu dưới dạng object {dates: [], values: []} từ API
    static render(data) {

        // Kiểm tra dữ liệu: Nếu là object từ API (có dates và values)
        if (!data || !data.dates || data.dates.length === 0) {
            console.warn("SeasonalChart: Dữ liệu DPO không hợp lệ hoặc rỗng.");
            Plotly.purge("seasonal-chart"); // Xóa chart cũ nếu không có data
            return;
        }

        const dates = data.dates;
        const dpoValues = data.values; // Dùng 'values' từ API

        // 1. Tạo Trace
        const trace = {
            x: dates,
            y: dpoValues, // [FIX] Dùng values
            name: "DPO",
            type: "scatter",
            mode: "lines",
            line: { color: "#a855f7", width: 2 },
            fill: "tozeroy",
            fillcolor: "rgba(168, 85, 247, 0.1)",
            
            // Marker để highlight điểm hover (giống TradingChart)
            marker: { size: 5, color: '#ffffff', line: { width: 2, color: '#a855f7' } },

            // Tooltip style
            hoverinfo: "x+y", 
            hovertemplate: "<b>Date:</b> %{x}<br><b>DPO:</b> %{y:.2f}<extra></extra>"
        };

        // 2. Cấu hình Layout (Áp dụng style Crosshair từ TradingChart)
        const layout = {
            title: { 
                text: "Seasonal Cycle (DPO)", 
                x: 0.02,
                font: { size: 14, color: '#e3e8ef' }
            },
            
            dragmode: 'pan', 
            hovermode: "closest", // Dùng closest để Crosshair hoạt động tốt hơn
            hoverdistance: -1, 
            spikedistance: -1,

            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)",
                bordercolor: "transparent", 
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0
            },

            // --- TRỤC X (Kẻ Dọc) ---
            xaxis: { 
                showgrid: true, 
                gridcolor: '#2a3548',
                showspikes: true, 
                spikethickness: 1,       
                spikecolor: '#999999',   // Màu xám
                spikedash: 'dash',       
                spikemode: 'across',
                spikesnap: 'cursor',     // [QUAN TRỌNG] Cho phép Crosshair chạy mượt
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#000'},
                hoverformat: '%b %d %Y' // Hiển thị ngày tháng đầy đủ
            },

            // --- TRỤC Y (Kẻ Ngang) ---
            yaxis: { 
                title: "Deviation ($)", 
                showgrid: true, 
                gridcolor: '#2a3548',
                zeroline: false,
                
                showspikes: true,
                spikethickness: 1,       
                spikecolor: '#999999',   
                spikedash: 'dash',       
                spikemode: 'across',
                spikesnap: 'cursor',     // Cho phép Crosshair chạy mượt
                
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#000'},
            },

            margin: { l: 50, r: 20, t: 40, b: 40 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#e3e8ef" },
            showlegend: false,

            // Đường Zero Line cố định
            shapes: [
                {
                    type: "line",
                    xref: "paper", x0: 0, x1: 1,
                    yref: "y", y0: 0, y1: 0,
                    line: { color: "rgba(255, 255, 255, 0.5)", width: 1, dash: "dash" },
                    layer: "below"
                },
            ],
        };

        const config = { 
            responsive: true, 
            displayModeBar: false, 
            scrollZoom: true 
        };

        Plotly.newPlot("seasonal-chart", [trace], layout, config);
    }
}