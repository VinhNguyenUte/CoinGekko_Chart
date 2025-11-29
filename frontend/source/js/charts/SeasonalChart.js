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
            
            // [QUAN TRỌNG] Đổi sang 'closest' để Crosshair hoạt động tự do theo chuột
            hovermode: "closest", 

            hoverlabel: {
                bgcolor: "#252d3d",
                bordercolor: "#2a3548",
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0
            },

            // Trục X (Đường dọc)
            xaxis: { 
                showgrid: true, 
                gridcolor: '#2a3548',
                zeroline: false,
                
                // Cấu hình đường gióng dọc
                showspikes: true, 
                spikethickness: 1,       // [FIX] Phải là số nguyên >= 1
                spikecolor: '#ffffff',   // Màu trắng
                spikedash: 'dash',       // Nét đứt
                spikemode: 'across',
                spikesnap: 'cursor',     // Dính theo con trỏ chuột
            },

            // Trục Y (Đường ngang)
            yaxis: { 
                title: "Deviation ($)", 
                showgrid: true, 
                gridcolor: '#2a3548',
                zeroline: false,
                
                // Cấu hình đường gióng ngang
                showspikes: true,
                spikethickness: 1,       // [FIX] Phải là số nguyên >= 1
                spikecolor: '#ffffff',   // Màu trắng (để red nếu muốn test)
                spikedash: 'dash',       // Nét đứt
                spikemode: 'across',
                spikesnap: 'cursor',     // Dính theo con trỏ chuột
            },

            margin: { l: 50, r: 20, t: 40, b: 40 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#e3e8ef" },

            // Đường Zero Line cố định
            shapes: [
                {
                    type: "line",
                    xref: "paper", x0: 0, x1: 1,
                    yref: "y", y0: 0, y1: 0,
                    line: { 
                        color: "rgba(255, 255, 255, 0.5)", 
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