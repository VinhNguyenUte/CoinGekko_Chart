class VolumePriceChart {
    static render(data) {
        const chartId = "scatter-chart";

        // 1. VALIDATION & DATA EXTRACTION
        // Kiểm tra dữ liệu cơ bản
        if (!data || !data.volumes || !data.changes || !data.dates) {
            this.showErrorState(chartId, "Không có dữ liệu Scatter để hiển thị.");
            return;
        }

        const volumes = data.volumes;
        const changes = data.changes; // API trả về "changes", không phải "changePercents"
        const dates = data.dates;

        // Kiểm tra độ dài dữ liệu
        if (volumes.length !== changes.length) {
            this.showErrorState(chartId, `Lỗi dữ liệu: Volume (${volumes.length}) và Change (${changes.length}) không khớp.`);
            return;
        }

        if (dates.length !== volumes.length) {
            this.showErrorState(chartId, `Lỗi dữ liệu: Volume (${volumes.length}) và Dates (${dates.length}) không khớp.`);
            return;
        }

        if (dates.length != changes.length) {
            this.showErrorState(chartId, `Lỗi dữ liệu: Dates (${dates.length}) và Change (${changes.length}) không khớp.`);
            return;
        }

        if (dates.length < 5) {
            this.showErrorState(chartId, "Dữ liệu quá ít để vẽ biểu đồ.");
            return;
        }

        // Xóa lỗi cũ (nếu có)
        this.clearErrorState(chartId);

        // 2. XỬ LÝ TRENDLINE
        let trendlineX = [];
        let trendlineY = [];

        if (data.trendline && typeof data.trendline.slope === 'number') {
            const slope = data.trendline.slope;
            const intercept = data.trendline.intercept;

            // Tính 2 điểm đầu cuối để vẽ đường thẳng
            // Lưu ý: Phải dùng biến 'volumes' đã khai báo ở trên
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
            y: changes,
            mode: "markers",
            type: "scatter",
            name: "Points",
            marker: { 
                // Xanh nếu tăng giá (>=0), Đỏ nếu giảm giá (<0)
                color: changes.map(v => v >= 0 ? '#00d084' : '#ff5766'),
                size: 8, 
                opacity: 0.7,
                line: { width: 1, color: 'rgba(255,255,255,0.2)' }
            },
            text: dates,
            // Custom hover: Hiện ngày, Vol và % thay đổi
            hovertemplate: "<b>Date: %{text}</b><br>Vol: %{x}<br>Change: %{y:.2f}%<extra></extra>",
        };

        // --- TRACE 2: ĐƯỜNG XU HƯỚNG ---
        const trace2 = {
            x: trendlineX,
            y: trendlineY,
            name: "Trend",
            type: "scatter",
            mode: "lines",
            line: { color: "#eab308", width: 2, dash: "dash" }, // Màu vàng
            hovertemplate: "Trendline<extra></extra>",
        };

        // --- LAYOUT ---
        const layout = {
            dragmode: 'pan',
            hovermode: "closest",
            
            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)", 
                bordercolor: "#2a3548",
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0 
            },

            xaxis: { 
                title: { text: "Volume", font: { size: 10, color: '#64748b' } }, 
                gridcolor: '#2a3548',
                tickfont: { color: '#e3e8ef', size: 10 },
                zeroline: false
            },
            yaxis: { 
                title: { text: "Price Change (%)", font: { size: 10, color: '#64748b' } }, 
                gridcolor: '#2a3548',
                tickfont: { color: '#e3e8ef', size: 10 },
                zeroline: true,
                zerolinecolor: '#64748b' // Đường kẻ ngang mức 0
            },
            
            margin: { l: 50, r: 20, t: 20, b: 40 }, // Căn chỉnh lề
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

        // Render biểu đồ
        Plotly.newPlot(chartId, [trace1, trace2], layout, config).then(() => {
            this.setupStaticLegend();
        });
    }

    // Chú thích tĩnh (Legend)
    static setupStaticLegend() {
        const legendContainer = document.getElementById("scatter-legend");
        if (!legendContainer) return;

        legendContainer.innerHTML = `
            <div class="legend-row" style="cursor: default; display: flex; gap: 10px; font-size: 11px;">
                <span class="legend-item" style="opacity: 1; cursor: default; display: flex; align-items: center;">
                    <span style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #00d084; margin-right: 4px;"></span>
                    <span class="legend-label" style="color: #e3e8ef;">Points</span>
                </span>
                <span class="legend-item" style="opacity: 1; cursor: default; display: flex; align-items: center;">
                    <span style="display:inline-block; width: 12px; height: 2px; background-color: #eab308; margin-right: 4px; border-top: 2px dashed #eab308;"></span>
                    <span class="legend-label" style="color: #eab308;">Trendline</span>
                </span>
            </div>
        `;
    }

    // --- CÁC HÀM HỖ TRỢ ERROR HANDLING (Bắt buộc phải có) ---

    static clearErrorState(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.removeAttribute("style");
            container.innerHTML = "";
        }
    }

    static showErrorState(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try { Plotly.purge(containerId); } catch (e) {}

        container.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                width: 100%;
                color: #ff5766; 
                background: rgba(26, 31, 46, 0.8);
                text-align: center;
                padding: 10px;">
                <span style="font-size: 24px; margin-bottom: 8px;">⚠️</span>
                <span style="font-size: 13px;">${message}</span>
            </div>
        `;
    }
}