class DashboardChart {
    static renderCorrelationHeatmap(matrix) {        
        const chartId = "correlation-heatmap";
        
        if (!matrix || !matrix.correlations || !matrix.coins) {
            console.warn("DashboardChart: No matrix data available to render.");
            this.showErrorState(chartId, "Không có dữ liệu để hiển thị.");
            return;
        }

        const coins = matrix.coins;
        const correlations = matrix.correlations;
        const numCoins = coins.length;
        const numRows = correlations.length;
        this.clearErrorState(chartId);

        if (numRows !== numCoins) {
            console.warn(`Mismatch: ${numCoins} coins nhưng có ${numRows} hàng dữ liệu.`);
            this.showErrorState(chartId, `Dữ liệu không đồng bộ (Lệch: ${numCoins} coin vs ${numRows} hàng).`);
            return;
        }

        for (let i = 0; i < numRows; i++) {
            if (correlations[i].length !== numCoins) {
                console.warn(`Mismatch at row ${i}: Cần ${numCoins} cột, tìm thấy ${correlations[i].length}.`);
                this.showErrorState(chartId, `Dữ liệu bị thiếu sót tại hàng ${coins[i]}.`);
                return;
            }
        }

        // Format giá trị hiển thị (2 số thập phân)
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
            colorbar: {
                thickness: 15,

                len: 0.9,
                tickfont: { color: "#e3e8ef" },
                titlefont: { color: "#e3e8ef" }
            },
        }

        const layout = {
            paper_bgcolor: "#1a1f2e",
            plot_bgcolor: "transparent",
            xaxis: { 
                side: "bottom", 
                tickfont: { color: "#e3e8ef", size: 12 },
                showgrid: false,
                fixedrange: true 
            },
            yaxis: { 
                autorange: "reversed", 
                tickfont: { color: "#e3e8ef", size: 12 },
                showgrid: false,
                fixedrange: true
            },
            font: { color: "#e3e8ef" }
        }
        const config = {
            responsive: true,
            displayModeBar: false
        }
        Plotly.newPlot("correlation-heatmap", [trace], layout, config);
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
                padding: 20px;">
                <span style="font-size: 32px; margin-bottom: 12px;">⚠️</span>
                <span style="font-size: 14px; font-weight: 500;">${message}</span>
            </div>
        `;
    }

}