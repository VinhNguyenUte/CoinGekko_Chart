class DashboardChart {
    static renderCorrelationHeatmap(matrix) {
      const textValues = matrix.correlations.map(row => row.map(val => val.toFixed(2)));

      const trace = {
        z: matrix.correlations,
        x: matrix.coins,
        y: matrix.coins,
        type: "heatmap",
        
        colorscale: "RdBu",
        reversescale: false,
        zmid: 0,
        zmin: -1,
        zmax: 1,

        text: textValues,
        texttemplate: "%{text}",
        textfont: {
            family: "Roboto, sans-serif",
            size: 12,
            color: "auto"
        },

        xgap: 2, 
        ygap: 2,

        hovertemplate: "<b>%{y} - %{x}</b><br>Correlation: %{z:.2f}<extra></extra>",
        
        // Thanh màu bên phải
        colorbar: { 
            thickness: 15, 
            len: 0.9,
            tickfont: { color: "#ffffffff" },
            titlefont: { color: "#ffffffff" }
        },
      }
  
      const layout = {
        title: { 
            text: "Correlation Heatmap", 
            x: 0.02,
            font: { size: 18, color: "#e3e8ef" }
        },
        margin: { l: 60, r: 50, t: 60, b: 60 },
        paper_bgcolor: "#1a1f2e", // Màu nền biểu đồ
        plot_bgcolor: "#ffffffff",  // Màu nền khung
        
        // Cấu hình trục X
        xaxis: { 
            side: "bottom", 
            tickfont: { color: "#e3e8ef", size: 12 },
            showgrid: false, // Tắt lưới vì đã có xgap
            fixedrange: true // Tắt zoom
        },

        // Cấu hình trục Y
        yaxis: { 
            autorange: "reversed", // Đảo chiều trục Y để giống ma trận (Dòng 1 ở trên cùng)
            tickfont: { color: "#e3e8ef", size: 12 },
            showgrid: false,
            fixedrange: true
        },
        
        font: { color: "#e3e8ef" }
      }
  
      const config = {
        responsive: true,
        displayModeBar: false // Ẩn thanh công cụ hover
      }

      Plotly.newPlot("correlation-heatmap", [trace], layout, config)
    }
}