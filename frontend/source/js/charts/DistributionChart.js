class DistributionChart {
    static render(data) {
        if (!data || !data.daily_returns || data.daily_returns.length === 0) {
            console.warn("DistributionChart: Không có dữ liệu 'daily_returns'.");
            return;
        }
        const returns = data.daily_returns; 
        
        const stats = data.stats || { mean: 0, std_dev: 1 };
        const mean = stats.mean;
        const std = stats.std_dev;

        if (data.daily_returns.length < 5) {
            this.showErrorState(chartId, "Dữ liệu quá ít để vẽ biểu đồ.");
            return;
        }

        const trace1 = {
            x: returns,
            type: "histogram",
            name: "Frequency",
            nbinsx: 30, 
            marker: { 
                color: "#4a7cff", 
                opacity: 0.6,
                line: { color: "rgba(255,255,255,0.1)", width: 1 } 
            },
            hovertemplate: "<b>Range:</b> %{x}%<br><b>Count:</b> %{y}<extra></extra>",
        };

        // Tính toán đường cong chuẩn (BELL CURVE)
        const xValues = [];
        const yValues = [];
        
        const minX = Math.min(...returns);
        const maxX = Math.max(...returns);
        const rangePadding = (maxX - minX) * 0.2; 
        const start = minX - rangePadding;
        const end = maxX + rangePadding;
        const step = (end - start) / 100; 

        for (let x = start; x <= end; x += step) {
            xValues.push(x); 
            if (std !== 0) {
                const exponent = -0.5 * Math.pow((x - mean) / std, 2);
                const probability = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
                yValues.push(probability);
            } else {
                yValues.push(0);
            }
        }
 
        const trace2 = {
            x: xValues,
            y: yValues,
            name: "Normal Dist.",
            type: "scatter",
            mode: "lines",
            line: { color: "#ff9500", width: 2 },
            yaxis: "y2", 
            hoverinfo: "skip"
        };

        const layout = {
            title: { 
                text: `Return Distribution (Mean: ${mean.toFixed(2)}%, Std: ${std.toFixed(2)}%)`, 
                x: 0.02,
                font: { color: "#e3e8ef", size: 14 }
            },
            
            dragmode: 'pan', 
            hovermode: 'closest',

            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)", 
                bordercolor: "#2a3548",
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0 
            },
            
            xaxis: { 
                title: "Daily Return (%)", 
                gridcolor: '#2a3548',
                zeroline: true, zerolinecolor: '#8892a0' 
            },
            
            yaxis: { 
                title: "Frequency", 
                gridcolor: '#2a3548',
                fixedrange: true 
            },

            yaxis2: {
                overlaying: "y", 
                side: "right",   
                showgrid: false, 
                showticklabels: false, 
                fixedrange: true
            },

            shapes: [{
                type: 'line',
                x0: mean, y0: 0, x1: mean, y1: 1, yref: 'paper',
                line: { color: '#ff9500', width: 1, dash: 'dash' },
                opacity: 0.5
            }],

            margin: { l: 50, r: 20, t: 40, b: 40 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            font: { color: "#e3e8ef" },
            showlegend: false
        };

        const config = { 
            responsive: true, 
            displayModeBar: false, 
            scrollZoom: true 
        };

        Plotly.newPlot("histogram-chart", [trace1, trace2], layout, config);
    }
}