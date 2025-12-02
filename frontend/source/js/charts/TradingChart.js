class TradingChart {
    static render(payload) {
        console.log(payload)
        const chartId = "trading-chart";

        // 1. KIỂM TRA DỮ LIỆU CỐT LÕI (Bắt buộc phải có)
        if (!payload || !payload.dates || !payload.prices) {
            this.showErrorState(chartId, "Không có dữ liệu giá để hiển thị.");
            return;
        }

        const dates = payload.dates;
        const prices = payload.prices;

        // Các chỉ báo (Có thể null hoặc rỗng)
        // Lưu ý: API nên trả về mảng có độ dài bằng dates, chứa null ở đầu
        const ma50 = payload.ma_50 || [];
        const bollUp = payload.boll_upper || [];
        const bollLow = payload.boll_lower || [];
        const rsi = payload.rsi || [];

        const meta = payload.meta || {};
        const indicators = meta.indicators || { ma: false, boll: false, rsi: true };
        const timeframe = meta.timeframe || '1d';

        // 2. VALIDATION CHẶT CHẼ CHO GIÁ & NGÀY
        if (dates.length !== prices.length) {
            this.showErrorState(chartId, "Lỗi dữ liệu: Số lượng Ngày và Giá không khớp.");
            return;
        }

        if (dates.length < 5) {
            this.showErrorState(chartId, "Dữ liệu quá ít để vẽ biểu đồ.");
            return;
        }

        this.clearErrorState(chartId);

        // 3. XỬ LÝ AN TOÀN CHO INDICATORS
        // Hàm helper để kiểm tra xem mảng indicator có hợp lệ để vẽ không
        // Hợp lệ = Có dữ liệu VÀ độ dài khớp với trục thời gian
        const isValidIndicator = (arr) => {
            if (!arr || arr.length === 0) return false;
            if (arr.length !== dates.length) {
                console.warn("TradingChart: Indicator length mismatch. Skipping render for this line.");
                return false;
            }
            return true;
        };

        const traces = [];

        // --- TRACE 0: PRICE (Index 0) ---
        traces.push({
            x: dates, y: prices,
            name: "Price", type: "scatter", mode: "lines",
            line: { color: "#00d084", width: 2 },
            marker: { size: 6, color: '#ffffff', line: { width: 2, color: '#00d084' } },
            hoverinfo: "y",
            hovertemplate: "Price: %{y:,.2f}<extra></extra>"
        });

        // --- TRACE 1: MA(50) (Index 1) ---
        // [SỬA] Luôn tạo trace, dùng 'visible' để ẩn/hiện
        traces.push({
            x: dates, y: ma50,
            name: "MA(50)", type: "scatter", mode: "lines",
            line: { color: "#ff9500", width: 1.5 },
            marker: { size: 5, color: '#ffffff', line: { width: 2, color: '#ff9500' } },
            hoverinfo: "y",
            hovertemplate: "MA(50): %{y:,.2f}<extra></extra>",

            // [QUAN TRỌNG] Nếu false thì là 'legendonly' (ẩn), ngược lại là true (hiện)
            visible: indicators.ma ? true : 'legendonly'
        });

        const bollVisible = indicators.boll ? true : 'legendonly';

        traces.push({
            x: dates, y: bollUp,
            name: "BOLL_UP", type: "scatter", mode: "lines",
            line: { width: 1, color: "#a855f7" },
            marker: { size: 4, color: '#ffffff', line: { width: 1, color: '#a855f7' } },
            hoverinfo: "y", hovertemplate: "UP: %{y:,.2f}<extra></extra>",
            showlegend: false,
            visible: bollVisible
        });

        traces.push({
            x: dates, y: bollLow,
            name: "BOLL_DN", type: "scatter", mode: "lines",
            line: { width: 1, color: "#a855f7" },
            fill: "tonexty", fillcolor: "rgba(168, 85, 247, 0.05)",
            marker: { size: 4, color: '#ffffff', line: { width: 1, color: '#a855f7' } },
            hoverinfo: "y", hovertemplate: "DN: %{y:,.2f}<extra></extra>",
            showlegend: false,
            visible: bollVisible
        });

        // --- TRACE 4: RSI (Index 4) ---
        // RSI vẫn nên giữ điều kiện IF để tránh vẽ trục phụ yaxis2 nếu không cần thiết
        if (indicators.rsi !== false) {
            traces.push({
                x: dates, y: rsi,
                name: "RSI(14)", type: "scatter", mode: "lines",
                xaxis: 'x', yaxis: 'y2',
                line: { color: "#a855f7", width: 1.5 },
                fill: "tozeroy", fillcolor: "rgba(168, 85, 247, 0.1)",
                marker: { size: 5, color: '#ffffff', line: { width: 2, color: '#a855f7' } },
                hoverinfo: "y", hovertemplate: "RSI: %{y:.2f}<extra></extra>"
            });
        }

        let hoverFormat = '%Y-%m-%d';
        if (timeframe === '1h' || timeframe === '15m') {
            hoverFormat = '%Y-%m-%d %H:%M';
        }

        const layout = {
            dragmode: 'pan',
            hovermode: 'x unified',
            hoverdistance: -1,
            spikedistance: -1,
            hoverlabel: { bgcolor: "rgba(37, 45, 61, 0.95)", bordercolor: "#2a3548", font: { color: "#e3e8ef", size: 12 }, namelength: 0 },
            xaxis: { anchor: 'y2', showgrid: true, gridcolor: '#2a3548', showspikes: true, spikethickness: 1, spikecolor: '#999999', spikedash: 'dot', spikemode: 'across', spikesnap: 'cursor', showline: false, showspikelabels: true, spikelabelfont: { size: 10, color: '#000' }, hoverformat: hoverFormat },
            yaxis: { domain: [0.25, 1], side: 'right', showgrid: true, gridcolor: '#2a3548', showspikes: true, spikethickness: 1, spikecolor: '#999999', spikedash: 'dot', spikemode: 'across', spikesnap: 'data', showline: false, showspikelabels: true, spikelabelfont: { size: 10, color: '#000' } },
            yaxis2: { domain: [0, 0.2], side: 'right', showgrid: false, range: [0, 100], tickvals: [30, 70], fixedrange: true, showspikes: true, spikethickness: 1, spikecolor: '#999999', spikedash: 'dot', spikemode: 'across', spikesnap: 'data', showspikelabels: true },
            margin: { l: 10, r: 60, t: 10, b: 30 },
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            showlegend: false,
            shapes: (isValidIndicator(rsi) && indicators.rsi !== false) ? [
                { type: "line", xref: "paper", x0: 0, x1: 1, yref: "y2", y0: 70, y1: 70, line: { color: "rgba(255,255,255,0.3)", width: 1, dash: "dot" } },
                { type: "line", xref: "paper", x0: 0, x1: 1, yref: "y2", y0: 30, y1: 30, line: { color: "rgba(255,255,255,0.3)", width: 1, dash: "dot" } }
            ] : []
        };

        const config = { responsive: true, displayModeBar: false, scrollZoom: true };

        Plotly.newPlot("trading-chart", traces, layout, config).then((gd) => {
            const lastIdx = dates.length - 1;
            const lastDataObj = {
                price: prices[lastIdx],
                ma_50: ma50[lastIdx],
                boll_upper: bollUp[lastIdx],
                boll_lower: bollLow[lastIdx],
                rsi: rsi[lastIdx]
            };
            this.setupInteractiveLegends(gd, payload, indicators, lastDataObj);
        });
    }

    static setupInteractiveLegends(graphDiv, rawData, indicators, lastData) {
        const legendContainer = document.getElementById("price-legend");

        const formatVal = (val) => {
            if (val === null || val === undefined) return 'N/A';
            return typeof val === 'number' ? val.toFixed(2) : val;
        };

        // Helper tạo item, thêm tham số isVisible để set class hidden
        const createItem = (id, label, value, color, isVisible) => `
            <span class="legend-item ${isVisible ? '' : 'hidden'}" id="${id}" style="color: ${color}">
                <span class="legend-label">${label}</span>
                <span class="legend-value">${formatVal(value)}</span>
            </span>`;

        const findTraceIndex = (name) => graphDiv.data.findIndex(t => t.name === name);

        const maIndex = findTraceIndex("MA(50)");
        const bollStartIndex = findTraceIndex("BOLL_UP");
        const rsiIndex = findTraceIndex("RSI(14)");

        // Check visible
        const isMaVisible = maIndex !== -1 && graphDiv.data[maIndex].visible === true;
        const isBollVisible = bollStartIndex !== -1 && graphDiv.data[bollStartIndex].visible === true;
        const isRsiVisible = rsiIndex !== -1 && graphDiv.data[rsiIndex].visible !== 'legendonly'; // RSI mặc định hiện

        // Render HTML: Luôn render thẻ span của MA và BOLL
        legendContainer.innerHTML = `
            <div class="legend-row">
                ${createItem('lg-price', 'Price', lastData.price, '#00d084', true)}
                ${createItem('lg-ma', 'MA(50)', lastData.ma_50, '#ff9500', isMaVisible)}
                ${createItem('lg-boll', 'BOLL', formatVal(lastData.boll_upper), '#a855f7', isBollVisible)}
            </div>
            ${indicators.rsi !== false ? `
            <div class="legend-row" style="margin-top: 5px; font-size: 11px;">
                ${createItem('lg-rsi', 'RSI(14)', lastData.rsi, '#a855f7', true)}
            </div>` : ''}
        `;

        // Gán sự kiện click: Luôn gán vì element luôn tồn tại
        document.getElementById('lg-ma').addEventListener('click', function () {
            const isHidden = this.classList.contains('hidden');
            this.classList.toggle('hidden');
            // Toggle giữa true (hiện) và 'legendonly' (ẩn nhưng giữ data)
            Plotly.restyle(graphDiv, { visible: isHidden ? true : 'legendonly' }, [maIndex]);
        });

        document.getElementById('lg-boll').addEventListener('click', function () {
            const isHidden = this.classList.contains('hidden');
            this.classList.toggle('hidden');
            Plotly.restyle(graphDiv, { visible: isHidden ? true : 'legendonly' }, [bollStartIndex, bollStartIndex + 1]);
        });

        if (indicators.rsi !== false) {
            document.getElementById('lg-rsi')?.addEventListener('click', function () {
                const isHidden = this.classList.contains('hidden');
                this.classList.toggle('hidden');
                // RSI nằm ở trục riêng, có thể dùng 'legendonly' hoặc false
                Plotly.restyle(graphDiv, { visible: isHidden ? true : 'legendonly' }, [rsiIndex]);
            });
        }

        // Hover Event
        graphDiv.on('plotly_hover', (dataEvent) => {
            const idx = dataEvent.points[0].pointIndex;

            // Lấy data an toàn
            const d = {
                price: rawData.prices ? rawData.prices[idx] : null,
                ma_50: rawData.ma_50 ? rawData.ma_50[idx] : null,
                boll_upper: rawData.boll_upper ? rawData.boll_upper[idx] : null,
                boll_lower: rawData.boll_lower ? rawData.boll_lower[idx] : null,
                rsi: rawData.rsi ? rawData.rsi[idx] : null
            };

            if (d) {
                document.querySelector('#lg-price .legend-value').textContent = formatVal(d.price);
                // Luôn cập nhật giá trị text kể cả khi ẩn (để khi bật lên là có số ngay)
                document.querySelector('#lg-ma .legend-value').textContent = formatVal(d.ma_50);

                const up = formatVal(d.boll_upper);
                const low = formatVal(d.boll_lower);
                document.querySelector('#lg-boll .legend-value').textContent = (up === 'N/A') ? 'N/A' : `${up} / ${low}`;

                if (indicators.rsi !== false) {
                    document.querySelector('#lg-rsi .legend-value').textContent = formatVal(d.rsi);
                }
            }
        });

        // Unhover Event
        graphDiv.on('plotly_unhover', () => {
            document.querySelector('#lg-price .legend-value').textContent = formatVal(lastData.price);
            document.querySelector('#lg-ma .legend-value').textContent = formatVal(lastData.ma_50);
            document.querySelector('#lg-boll .legend-value').textContent = formatVal(lastData.boll_upper);
            if (indicators.rsi !== false) {
                document.querySelector('#lg-rsi .legend-value').textContent = formatVal(lastData.rsi);
            }
        });
    }

    static clearErrorState(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.removeAttribute("style");

            // 2. [SỬA LẠI] Luôn xóa sạch nội dung cũ (thông báo lỗi rác)
            // Không cần kiểm tra class 'js-plotly-plot' nữa để đảm bảo container sạch sẽ
            container.innerHTML = "";
        }
    }

    static showErrorState(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;

        Plotly.purge(containerId); // Xóa biểu đồ Plotly
        const legendContainer = document.getElementById("price-legend");
        if (legendContainer) legendContainer.innerHTML = "";

        // Thêm style trực tiếp vào container để căn giữa thông báo lỗi
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
                z-index: 100;
                position: relative;">
                
                <span style="font-size: 32px; margin-bottom: 12px;">⚠️</span>
                <span style="font-size: 16px; font-weight: 500;">${message}</span>
            </div>
        `;
    }
}