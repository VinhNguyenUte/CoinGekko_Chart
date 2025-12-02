class SeasonalChart {
    static render(data) {
        const chartId = "seasonal-chart";

        console.log(data)

        // 2. Validate dữ liệu đầu vào
        if (!data || !data.dates || !data.values) {
            this.showErrorState(chartId, "Không có dữ liệu DPO để hiển thị.");
            return;
        }

        const dates = data.dates;
        const dpoValues = data.values;

        // Kiểm tra độ dài mảng
        if (dates.length !== dpoValues.length) {
            this.showErrorState(chartId, `Lỗi dữ liệu: Thời gian (${dates.length}) và Giá trị (${dpoValues.length}) không khớp.`);
            return;
        }

        if (dates.length < 5) {
            this.showErrorState(chartId, "Dữ liệu quá ít để vẽ biểu đồ.");
            return;
        }

        // 3. Xóa lỗi cũ trước khi vẽ (Logic mới cập nhật)
        this.clearErrorState(chartId);

        // 1. Tạo Trace
        const trace = {
            x: dates,
            y: dpoValues,
            name: "DPO",
            type: "scatter",
            mode: "lines",
            line: { color: "#a855f7", width: 2 },
            fill: "tozeroy",
            fillcolor: "rgba(168, 85, 247, 0.1)",
            
            // Marker: Điểm tròn nổi bật khi hover
            marker: { 
                size: 6, 
                color: '#ffffff', 
                line: { width: 2, color: '#a855f7' } 
            },

            // Tooltip: Chỉ hiện giá trị Y, ngày tháng đã có ở trục X
            hoverinfo: "y", 
            hovertemplate: "<b>DPO:</b> %{y:.2f}<extra></extra>"
        };

        // 2. Cấu hình Layout
        const layout = {
            dragmode: 'pan', 
            
            // [SỬA QUAN TRỌNG] Đổi thành 'x unified' để đồng bộ trục dọc
            hovermode: 'x unified', 
            
            // Cho phép bắt điểm từ xa (Vô tận)
            hoverdistance: -1, 
            spikedistance: -1,

            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)",
                bordercolor: "#2a3548", 
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0
            },

            // --- TRỤC X (Kẻ Dọc - Đi theo chuột) ---
            xaxis: { 
                showgrid: true, 
                gridcolor: '#2a3548',
                
                showspikes: true, 
                spikethickness: 1,       
                spikecolor: '#999999',   
                spikedash: 'dot',       
                spikemode: 'across',
                
                // [QUAN TRỌNG] 'cursor': Đường dọc chạy mượt theo chuột
                spikesnap: 'cursor',     
                
                showline: false,
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#000'},
                hoverformat: '%b %d %Y' 
            },

            // --- TRỤC Y (Kẻ Ngang - Bám điểm) ---
            yaxis: { 
                title: "Deviation ($)", 
                showgrid: true, 
                gridcolor: '#2a3548',
                zeroline: false,
                
                showspikes: true,
                spikethickness: 1,       
                spikecolor: '#999999',   
                spikedash: 'dot',       
                spikemode: 'across',
                
                // [QUAN TRỌNG] 'data': Đường ngang dính chặt vào giá trị biểu đồ
                spikesnap: 'data',     
                
                showline: false,
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

    static clearErrorState(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.removeAttribute("style");
            container.innerHTML = ""; // Xóa sạch nội dung cũ
        }
    }

    static showErrorState(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Xóa biểu đồ Plotly cũ
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