class DashboardChart {
    static renderCorrelationHeatmap(matrix) {        
        if (!matrix || !matrix.correlations || !matrix.coins) {
            console.warn("DashboardChart: No matrix data available to render.");
            return;
        }

        // 2. Format giá trị hiển thị (2 số thập phân)
        const textValues = matrix.correlations.map(row => row.map(val => val.toFixed(2)));

        const trace = {
            z: matrix.correlations,
            x: matrix.coins,
            y: matrix.coins,
            type: "heatmap",
            
            // Dải màu: Đỏ (1) -> Trắng (0) -> Xanh (-1)
            colorscale: "RdBu",
            reversescale: false, // Đỏ là dương (nóng), Xanh là âm (lạnh)
            zmid: 0,
            zmin: -1,
            zmax: 1,

            text: textValues,
            texttemplate: "%{text}",
            textfont: {
                family: "Roboto, sans-serif",
                size: 12,
                color: "auto" // Plotly tự chọn màu chữ trắng/đen tùy nền
            },

            xgap: 2, 
            ygap: 2,

            hovertemplate: "<b>%{y} - %{x}</b><br>Correlation: %{z:.2f}<extra></extra>",
            
            // Thanh màu bên phải
            colorbar: { 
                thickness: 15, 
                len: 0.9,
                tickfont: { color: "#e3e8ef" },
                titlefont: { color: "#e3e8ef" }
            },
        }
  
        const layout = {
            paper_bgcolor: "#1a1f2e", // Màu nền card
            plot_bgcolor: "transparent",
            
            // Cấu hình trục X
            xaxis: { 
                side: "bottom", 
                tickfont: { color: "#e3e8ef", size: 12 },
                showgrid: false,
                fixedrange: true // Tắt zoom
            },

            // Cấu hình trục Y
            yaxis: { 
                autorange: "reversed", // Đảo chiều để coin đầu tiên nằm trên cùng
                tickfont: { color: "#e3e8ef", size: 12 },
                showgrid: false,
                fixedrange: true
            },
            
            font: { color: "#e3e8ef" }
        }
  
        const config = {
            responsive: true,
            displayModeBar: false // Ẩn thanh công cụ hover cho gọn
        }

        // Vẽ biểu đồ vào div có id="correlation-heatmap"
        Plotly.newPlot("correlation-heatmap", [trace], layout, config);
    }
}