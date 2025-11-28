import { commonLayout, plotlyConfig, themeColors } from '../config.js';

export function renderScatterPlot(scatterData) {
    if (!scatterData) return;

    // Tách dữ liệu từ mảng object
    const xVol = scatterData.points.map(p => p.volume);
    const yChange = scatterData.points.map(p => p.change);

    const tracePoints = {
        x: xVol,
        y: yChange,
        mode: 'markers',
        type: 'scatter',
        marker: {
            color: yChange.map(v => v >= 0 ? themeColors.neonGreen : themeColors.neonRed),
            size: 8,
            opacity: 0.8
        },
        name: 'Market Data'
    };

    // Vẽ Trendline (Giả lập đường thẳng y = ax + b)
    const minX = Math.min(...xVol);
    const maxX = Math.max(...xVol);
    const { slope, intercept } = scatterData.trendline;
    
    const traceLine = {
        x: [minX, maxX],
        y: [minX * slope + intercept, maxX * slope + intercept],
        mode: 'lines',
        name: 'Trend',
        line: { color: '#ffffff', dash: 'dash', width: 1 }
    };

    const layout = {
        ...commonLayout,
        xaxis: { ...commonLayout.xaxis, title: 'Volume (Billion)' },
        yaxis: { ...commonLayout.yaxis, title: 'Return (%)' },
        margin: { t: 10, r: 10, b: 40, l: 50 },
        showlegend: false
    };

    window.Plotly.newPlot("scatter-plot", [tracePoints, traceLine], layout, plotlyConfig);
}