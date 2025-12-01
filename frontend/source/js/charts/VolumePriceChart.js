class VolumePriceChart {
    static render(data) {
        const scatter = []
        const dates = []

        for (let i = 1; i < data.length; i++) {
            const change = ((data[i].price - data[i - 1].price) / data[i - 1].price) * 100
            scatter.push({ volume: data[i].volume, change, date: data[i].date })
            dates.push(data[i].date)
        }

        const volumes = scatter.map((s) => s.volume)
        const changePercents = scatter.map((s) => s.change)

        // Tính toán Trendline
        const n = scatter.length
        const sumX = volumes.reduce((a, b) => a + b, 0)
        const sumY = changePercents.reduce((a, b) => a + b, 0)
        const sumXY = volumes.reduce((sum, v, i) => sum + v * changePercents[i], 0)
        const sumX2 = volumes.reduce((sum, v) => sum + v * v, 0)

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n

        const trendlineY = volumes.map((v) => slope * v + intercept)

        const trace1 = {
            x: volumes,
            y: changePercents,
            mode: "markers",
            type: "scatter",
            name: "Volume-Price Points",
            marker: { color: "#4a7cff", size: 6, opacity: 0.7 },
            text: dates,
            hovertemplate: "<b>Date: %{text}</b><br>Volume: %{x}<br>Change: %{y:.2f}%<extra></extra>",
        }

        const trace2 = {
            x: volumes,
            y: trendlineY,
            name: "Trendline",
            type: "scatter",
            mode: "lines",
            line: { color: "#ff5766", width: 2, dash: "dash" },
            hovertemplate: "",
        }

        const layout = {
            xaxis: { title: "Volume" },
            yaxis: { title: "Price Change (%)" },
            hovermode: "closest",
            margin: { l: 60, r: 20, t: 50, b: 50 },
            paper_bgcolor: "#1a1f2e",
            plot_bgcolor: "#252d3d",
            font: { color: "#e3e8ef" },
        }

        Plotly.newPlot("scatter-chart", [trace1, trace2], layout, { responsive: true })
    }
}