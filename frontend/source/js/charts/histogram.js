import { commonLayout, plotlyConfig, themeColors } from '../config.js';

export function renderRiskHistogram(histData) {
    if (!histData) return;

    const trace = {
        x: histData.returns,
        type: 'histogram',
        marker: {
            color: themeColors.neonPurple,
            line: { color: 'rgba(255,255,255,0.2)', width: 1 }
        },
        opacity: 0.7
    };

    const layout = {
        ...commonLayout,
        xaxis: { ...commonLayout.xaxis, title: 'Daily Return (%)' },
        yaxis: { ...commonLayout.yaxis, title: 'Frequency' },
        margin: { t: 10, r: 10, b: 40, l: 50 },
        shapes: [{ // Vẽ đường kẻ dọc ở số 0
            type: 'line',
            x0: 0, x1: 0,
            y0: 0, y1: 1,
            yref: 'paper',
            line: { color: 'white', dash: 'dot', width: 1 }
        }]
    };

    window.Plotly.newPlot("risk-histogram", [trace], layout, plotlyConfig);
}