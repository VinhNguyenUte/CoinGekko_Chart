class SeasonalChart {
    static render(data) {
        const chartId = "seasonal-chart";
        
        if (!data || !data.date || !data.value) {
            this.showErrorState(chartId, "Không có dữ liệu DPO để hiển thị.");
            return;
        }

        const dates = data.date;
        const dpoValues = data.value;

        if (dates.length !== dpoValues.length) {
            this.showErrorState(chartId, `Lỗi dữ liệu: Thời gian (${dates.length}) và Giá trị (${dpoValues.length}) không khớp.`);
            return;
        }

        if (dates.length < 5) {
            this.showErrorState(chartId, "Dữ liệu quá ít để vẽ biểu đồ.");
            return;
        }

        this.clearErrorState(chartId);

        const trace = {
            x: dates,
            y: dpoValues,
            name: "DPO",
            type: "scatter",
            mode: "lines",
            line: { color: "#a855f7", width: 2 },
            fill: "tozeroy",
            fillcolor: "rgba(168, 85, 247, 0.1)",
            marker: { 
                size: 6, 
                color: '#ffffff', 
                line: { width: 2, color: '#a855f7' } 
            },
            hoverinfo: "y", 
            hovertemplate: "<b>DPO:</b> %{y:.2f}<extra></extra>"
        };

        const layout = {
            dragmode: 'pan', 
            hovermode: 'x unified', 
            hoverdistance: -1, 
            spikedistance: -1,
            hoverlabel: {
                bgcolor: "rgba(37, 45, 61, 0.95)",
                bordercolor: "#2a3548", 
                font: { color: "#e3e8ef", size: 12 },
                namelength: 0
            },
            xaxis: { 
                showgrid: true, 
                gridcolor: '#2a3548',
                showspikes: true, 
                spikethickness: 1,       
                spikecolor: '#999999',   
                spikedash: 'dot',       
                spikemode: 'across',
                spikesnap: 'cursor',     
                showline: false,
                showspikelabels: true,
                spikelabelfont: {size: 10, color: '#000'},
                hoverformat: '%b %d %Y' 
            },
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