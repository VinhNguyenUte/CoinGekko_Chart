import { commonLayout, plotlyConfig, themeColors } from '../config.js';

export function renderCorrelationHeatmap(apiData) {
    if (!apiData) return;

    const data = [{
        z: apiData.z_values,
        x: apiData.labels,
        y: apiData.labels,
        type: 'heatmap',
        colorscale: [
            [0, themeColors.neonRed], 
            [0.5, "#1e293b"], 
            [1, themeColors.neonGreen]
        ],
        showscale: true
    }];

    const layout = {
        ...commonLayout,
        margin: { t: 10, r: 10, b: 40, l: 40 },
        height: 350
    };

    window.Plotly.newPlot("correlation-heatmap", data, layout, plotlyConfig);
}