class TradingChart {
    static render(data, indicators = {}) {
        const dates = data.map(d => d.date);
        const lastIdx = data.length - 1;

        const traces = [];

        // =============================================
        // 1. CẤU HÌNH TRACES (ĐƯỜNG VẼ)
        // =============================================

        // --- TRACE 0: PRICE ---
        traces.push({
            x: dates, y: data.map(d => d.price),
            name: "Price", type: "scatter", mode: "lines",
            line: { color: "#00d084", width: 2 },
            
            // Marker ẩn, sẽ hiện khi hover (nhờ layout hovermode)
            marker: { size: 6, color: '#ffffff', line: { width: 2, color: '#00d084' } },
            
            // [QUAN TRỌNG] hoverinfo: 'y' để tương thích với spikesnap: 'data'
            hoverinfo: "y", 
            hovertemplate: "Price: %{y:,.2f}<extra></extra>"
        });

        // --- TRACE 1: MA(50) ---
        traces.push({
            x: dates, y: data.map(d => d.ma_50),
            name: "MA(50)", type: "scatter", mode: "lines",
            line: { color: "#ff9500", width: 1.5 },
            
            marker: { size: 5, color: '#ffffff', line: { width: 2, color: '#ff9500' } },

            hoverinfo: "y",
            hovertemplate: "MA(50): %{y:,.2f}<extra></extra>",
            visible: indicators.ma !== false ? true : "legendonly"
        });

        // --- TRACE 2 & 3: BOLL ---
        if (indicators.boll !== false) {
            traces.push({
                x: dates, y: data.map(d => d.boll_upper),
                name: "BOLL_UP", type: "scatter", mode: "lines",
                line: { width: 1, color: "#a855f7" },
                marker: { size: 4, color: '#ffffff', line: { width: 1, color: '#a855f7' } },
                hoverinfo: "y", hovertemplate: "UP: %{y:,.2f}<extra></extra>",
                showlegend: false
            });
            traces.push({
                x: dates, y: data.map(d => d.boll_lower),
                name: "BOLL_DN", type: "scatter", mode: "lines",
                line: { width: 1, color: "#a855f7" },
                fill: "tonexty", fillcolor: "rgba(168, 85, 247, 0.05)",
                marker: { size: 4, color: '#ffffff', line: { width: 1, color: '#a855f7' } },
                hoverinfo: "y", hovertemplate: "DN: %{y:,.2f}<extra></extra>",
                showlegend: false
            });
        }

        // --- TRACE RSI (TRỤC Y2) ---
        if (indicators.rsi !== false) {
            traces.push({
                x: dates, y: data.map(d => d.rsi),
                name: "RSI(14)", type: "scatter", mode: "lines",
                xaxis: 'x', yaxis: 'y2',
                line: { color: "#a855f7", width: 1.5 },
                fill: "tozeroy", fillcolor: "rgba(168, 85, 247, 0.1)",
                
                marker: { size: 5, color: '#ffffff', line: { width: 2, color: '#a855f7' } },

                hoverinfo: "y", hovertemplate: "RSI: %{y:.2f}<extra></extra>"
            });
        }

        // =============================================
        // 2. CẤU HÌNH LAYOUT (SỬA ĐỔI CHÍNH Ở ĐÂY)
        // =============================================
        const layout = {
            dragmode: 'pan',
            
            // 1. Hiển thị Marker trên TẤT CẢ các line cùng lúc
            hovermode: 'x unified', 

            hoverdistance: 100, // Tăng phạm vi bắt điểm
            spikedistance: 100, // Tăng phạm vi hiện đường kẻ
            
            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)", 
                bordercolor: "#2a3548",
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0 
            },

            // --- TRỤC X (Kẻ dọc) ---
            xaxis: {
                anchor: 'y2', 
                showgrid: true, gridcolor: '#2a3548',
                
                showspikes: true,           
                spikethickness: 1,          
                spikecolor: '#ff0000ff',      
                spikedash: 'dot',          
                spikemode: 'across', 
                
                // Trục dọc thì đi theo con trỏ chuột cho mượt
                spikesnap: 'cursor',        
                
                showline: false,            
                showspikelabels: true,      
                spikelabelfont: {size: 10, color: '#000'},
                hoverformat: '%Y-%m-%d' 
            },

            // --- TRỤC Y1 (GIÁ) - Kẻ ngang & Bám điểm ---
            yaxis: {
                domain: [0.25, 1], side: 'right', 
                showgrid: true, gridcolor: '#2a3548',
                
                showspikes: true,
                spikethickness: 1,
                spikecolor: '#ff0000ff',
                spikedash: 'dot',
                spikemode: 'across', // Kẻ xuyên suốt sang phải
                
                // [SỬA QUAN TRỌNG]: Đổi từ 'cursor' sang 'data'
                // Để đường kẻ ngang tự động hít vào đường line gần nhất
                spikesnap: 'data',   
                
                showline: false,
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#000'},
            },

            // --- TRỤC Y2 (RSI) ---
            yaxis2: {
                domain: [0, 0.2], side: 'right', showgrid: false,
                range: [0, 100], tickvals: [30, 70], fixedrange: true,

                showspikes: true,
                spikethickness: 1,
                spikecolor: '#888888',
                spikedash: 'dash',
                spikemode: 'across',
                
                // [SỬA QUAN TRỌNG]: Cũng dùng 'data' cho RSI
                spikesnap: 'data',
                
                showspikelabels: true,
            },

            margin: { l: 10, r: 60, t: 10, b: 30 },
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            showlegend: false,
            
            shapes: indicators.rsi !== false ? [
                { type: "line", xref: "paper", x0: 0, x1: 1, yref: "y2", y0: 70, y1: 70, line: { color: "rgba(255,255,255,0.3)", width: 1, dash: "dot" } },
                { type: "line", xref: "paper", x0: 0, x1: 1, yref: "y2", y0: 30, y1: 30, line: { color: "rgba(255,255,255,0.3)", width: 1, dash: "dot" } }
            ] : []
        };

        const config = { responsive: true, displayModeBar: false, scrollZoom: true };

        Plotly.newPlot("trading-chart", traces, layout, config).then((gd) => {
            this.setupInteractiveLegends(gd, data, indicators);
        });
    }

    // (Giữ nguyên phần setupInteractiveLegends của bạn)
    static setupInteractiveLegends(graphDiv, data, indicators) {
        // ... (Code cũ của bạn giữ nguyên, không cần sửa) ...
        const legendContainer = document.getElementById("price-legend");
        const lastData = data[data.length - 1];

        const formatVal = (val) => {
            if (val === null || val === undefined) return 'N/A';
            return typeof val === 'number' ? val.toFixed(2) : val;
        };
        
        const createItem = (id, label, value, color, isVisible) => `
            <span class="legend-item ${isVisible ? '' : 'hidden'}" id="${id}" style="color: ${color}">
                <span class="legend-label">${label}</span>
                <span class="legend-value">${formatVal(value)}</span>
            </span>`;

        let rsiIndex = -1;
        let bollStartIndex = -1;
        let traceCount = 2; 

        if (indicators.boll !== false) {
            bollStartIndex = 2;
            traceCount += 2;
        }
        if (indicators.rsi !== false) {
            rsiIndex = traceCount;
        }

        const isMaVisible = graphDiv.data[1] && graphDiv.data[1].visible !== 'legendonly';
        const isRsiVisible = rsiIndex !== -1 && graphDiv.data[rsiIndex] && graphDiv.data[rsiIndex].visible !== 'legendonly';

        legendContainer.innerHTML = `
            <div class="legend-row">
                ${createItem('lg-price', 'Price', lastData.price, '#00d084', true)}
                ${createItem('lg-ma', 'MA(50)', lastData.ma_50, '#ff9500', isMaVisible)}
                ${indicators.boll !== false ? createItem('lg-boll', 'BOLL', formatVal(lastData.boll_upper), '#a855f7', true) : ''}
            </div>
            ${indicators.rsi !== false ? `
            <div class="legend-row" style="margin-top: 5px; font-size: 11px;">
                ${createItem('lg-rsi', 'RSI(14)', lastData.rsi, '#a855f7', isRsiVisible)}
            </div>` : ''}
        `;

        document.getElementById('lg-ma')?.addEventListener('click', function() {
            this.classList.toggle('hidden');
            Plotly.restyle(graphDiv, { visible: this.classList.contains('hidden') ? 'legendonly' : true }, [1]);
        });
        
        if (indicators.boll !== false) {
            document.getElementById('lg-boll')?.addEventListener('click', function() {
                this.classList.toggle('hidden');
                Plotly.restyle(graphDiv, { visible: this.classList.contains('hidden') ? 'legendonly' : true }, [bollStartIndex, bollStartIndex + 1]);
            });
        }

        if (indicators.rsi !== false) {
            document.getElementById('lg-rsi')?.addEventListener('click', function() {
                this.classList.toggle('hidden');
                Plotly.restyle(graphDiv, { visible: this.classList.contains('hidden') ? 'legendonly' : true }, [rsiIndex]);
            });
        }

        graphDiv.on('plotly_hover', (dataEvent) => {
            const idx = dataEvent.points[0].pointIndex;
            const d = data[idx];
            if (d) {
                document.querySelector('#lg-price .legend-value').textContent = formatVal(d.price);
                document.querySelector('#lg-ma .legend-value').textContent = formatVal(d.ma_50);
                if (indicators.boll !== false) {
                    const up = formatVal(d.boll_upper);
                    const low = formatVal(d.boll_lower);
                    document.querySelector('#lg-boll .legend-value').textContent = (up === 'N/A') ? 'N/A' : `${up} / ${low}`;
                }
                if (indicators.rsi !== false) {
                    document.querySelector('#lg-rsi .legend-value').textContent = formatVal(d.rsi);
                }
            }
        });

        graphDiv.on('plotly_unhover', () => {
             document.querySelector('#lg-price .legend-value').textContent = formatVal(lastData.price);
             document.querySelector('#lg-ma .legend-value').textContent = formatVal(lastData.ma_50);
             if(indicators.boll !== false) document.querySelector('#lg-boll .legend-value').textContent = formatVal(lastData.boll_upper);
             if(indicators.rsi !== false) document.querySelector('#lg-rsi .legend-value').textContent = formatVal(lastData.rsi);
        });
    }
}