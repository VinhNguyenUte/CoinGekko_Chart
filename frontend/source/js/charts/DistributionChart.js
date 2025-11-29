class DistributionChart {
    static render(data) {
        const returns = []
        for (let i = 1; i < data.length; i++) {
            const ret = ((data[i].price - data[i - 1].price) / data[i - 1].price) * 100
            returns.push(ret)
        }

        const mean = returns.reduce((a, b) => a + b) / returns.length
        const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length)

        const trace = {
            x: returns,
            type: "histogram",
            name: "Daily Returns",
            nbinsx: 30,
            marker: { color: "#4a7cff", opacity: 0.7 },
            hovertemplate: "Return Range<br>Frequency: %{y}<extra></extra>",
        }

        const layout = {
            title: { text: `Return Distribution (Mean: ${mean.toFixed(2)}%, Std: ${std.toFixed(2)}%)`, x: 0.02 },
            xaxis: { title: "Daily Return (%)" },
            yaxis: { title: "Frequency" },
            margin: { l: 60, r: 20, t: 60, b: 50 },
            paper_bgcolor: "#1a1f2e",
            plot_bgcolor: "#252d3d",
            font: { color: "#e3e8ef" },
        }

        Plotly.newPlot("histogram-chart", [trace], layout, { responsive: true })
    }
}