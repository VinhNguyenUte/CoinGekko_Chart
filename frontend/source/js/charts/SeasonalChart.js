class SeasonalChart {
    static render(data) {
        const dpo = DataGenerator.calculateDPO(data, 20); 
        const dates = data.map((d) => d.date);

        const trace = {
            x: dates,
            y: dpo,
            name: "DPO",
            type: "scatter",
            mode: "lines",
            line: { color: "#a855f7", width: 2 },
            fill: "tozeroy",
            fillcolor: "rgba(168, 85, 247, 0.1)",
            
            // Tooltip style
            hoverinfo: "x+y", // Hiện cả ngày và giá trị
            hovertemplate: "<b>Date:</b> %{x}<br><b>DPO:</b> %{y:.2f}<extra></extra>"
        };

        const layout = {
            title: { 
                text: "Seasonal Cycle (DPO)", 
                x: 0.02,
                font: { size: 14, color: '#e3e8ef' }
            },
            
            dragmode: 'pan', 
            
            // 1. [QUAN TRỌNG] Đồng bộ kiểu hover
            hovermode: "x unified", 
            hoverdistance: 100,
            spikedistance: 100,

            // 2. Xóa viền Tooltip
            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)",
                bordercolor: "transparent", // Xóa viền trắng
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0
            },

            // --- TRỤC X (Kẻ Dọc) ---
            xaxis: { 
                showgrid: true, 
                gridcolor: '#2a3548',
                zeroline: false,
                
                // Cấu hình đường gióng dọc
                showspikes: true, 
                spikethickness: 1,       
                spikecolor: '#666666',   // Màu xám
                spikedash: 'dot',        // Chấm bi
                spikemode: 'across',
                spikesnap: 'cursor',     // Dọc theo chuột
                
                showline: false,
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#e3e8ef'},
                hoverformat: '%b %d'
            },

            // --- TRỤC Y (Kẻ Ngang) ---
            yaxis: { 
                title: "Deviation ($)", 
                showgrid: true, 
                gridcolor: '#2a3548',
                zeroline: false, // Tắt zeroline mặc định để vẽ shape đẹp hơn
                
                // Cấu hình đường gióng ngang
                showspikes: true,
                spikethickness: 1,       
                spikecolor: '#666666',   // Màu xám
                spikedash: 'dot',        // Chấm bi
                spikemode: 'across',
                spikesnap: 'data',       // [QUAN TRỌNG] Bám vào đường DPO
                
                showline: false,
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#e3e8ef'},
            },

            margin: { l: 50, r: 20, t: 40, b: 40 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#e3e8ef" },
            showlegend: false,

            // Đường Zero Line cố định (Màu trắng mờ ở giữa)
            shapes: [
                {
                    type: "line",
                    xref: "paper", x0: 0, x1: 1,
                    yref: "y", y0: 0, y1: 0,
                    line: { 
                        color: "rgba(255, 255, 255, 0.3)", 
                        width: 1, 
                        dash: "dash" 
                    },
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