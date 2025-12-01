class VolumePriceChart {
    static render(data) {
        // [FIX] Kiểm tra dữ liệu dựa trên cấu trúc API log bạn gửi
        // data ở đây chính là object scatterData: { changes: [], volumes: [], trendline: {...}, ... }
        if (!data || !data.volumes || !data.changes) {
            console.warn("ScatterChart: Dữ liệu API không đầy đủ.");
            return;
        }

        // 1. LẤY DỮ LIỆU TRỰC TIẾP TỪ API
        const volumes = data.volumes;       // Trục X
        const changePercents = data.changes;// Trục Y
        const dates = data.dates;           // Tooltip
        
        // 2. XỬ LÝ TRENDLINE (Server đã tính sẵn slope và intercept)
        let trendlineX = [];
        let trendlineY = [];

        if (data.trendline) {
            const slope = data.trendline.slope;
            const intercept = data.trendline.intercept;

            // Tính 2 điểm đầu cuối để vẽ đường thẳng
            const minVol = Math.min(...volumes);
            const maxVol = Math.max(...volumes);

            trendlineX = [minVol, maxVol];
            trendlineY = [
                slope * minVol + intercept, // y = ax + b
                slope * maxVol + intercept
            ];
        }

        // --- TRACE 1: CÁC ĐIỂM DỮ LIỆU ---
        const trace1 = {
            x: volumes,
            y: changePercents,
            mode: "markers",
            type: "scatter",
            name: "Points",
            marker: { 
                // Xanh nếu tăng giá (>0), Đỏ nếu giảm giá (<0)
                color: changePercents.map(v => v >= 0 ? '#00d084' : '#ff5766'),
                size: 8, 
                opacity: 0.7,
                line: { width: 1, color: 'rgba(255,255,255,0.2)' }
            },
            text: dates,
            hovertemplate: "<b>Date: %{text}</b><br>Vol: %{x}<br>Change: %{y:.2f}%<extra></extra>",
        };

        // --- TRACE 2: ĐƯỜNG XU HƯỚNG ---
        const trace2 = {
            x: trendlineX,
            y: trendlineY,
            name: "Trend",
            type: "scatter",
            mode: "lines",
            line: { color: "#ff9500", width: 2, dash: "dash" },
            hovertemplate: "Trendline<extra></extra>",
        };

        // --- LAYOUT ---
        const layout = {
            // title: { text: "Volume-Price Correlation", ... }, // Đã có title ở HTML
            dragmode: 'pan',
            hovermode: "closest",
            
            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)", 
                bordercolor: "#2a3548",
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0 
            },

            xaxis: { 
                title: "Volume", 
                gridcolor: '#2a3548',
                zeroline: false
            },
            yaxis: { 
                title: "Price Change (%)", 
                gridcolor: '#2a3548',
                zeroline: true,
                zerolinecolor: '#8892a0'
            },
            
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

        Plotly.newPlot("scatter-chart", [trace1, trace2], layout, config).then(() => {
            this.setupStaticLegend();
        });
    }

    // Chú thích tĩnh (như bài trước đã làm)
    static setupStaticLegend() {
        const legendContainer = document.getElementById("scatter-legend");
        if (!legendContainer) return;

        legendContainer.innerHTML = `
            <div class="legend-row" style="cursor: default;">
                <span class="legend-item" style="opacity: 1; cursor: default;">
                    <span style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #00d084; margin-right: 4px;"></span>
                    <span class="legend-label" style="color: #e3e8ef;">Points</span>
                </span>
                <span class="legend-item" style="opacity: 1; cursor: default;">
                    <span style="display:inline-block; width: 12px; height: 2px; background-color: #ff9500; margin-right: 4px; border-top: 2px dashed #ff9500;"></span>
                    <span class="legend-label" style="color: #ff9500;">Trendline</span>
                </span>
            </div>
        `;
    }
}