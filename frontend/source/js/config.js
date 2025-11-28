export const themeColors = {
    bg: "rgba(21, 28, 40, 0)",
    text: "#94a3b8",
    grid: "rgba(30, 41, 59, 0.5)",
    neonGreen: "#00ff88",
    neonRed: "#ff3366",
    neonBlue: "#00d4ff",
    neonPurple: "#a855f7"
};

export const commonLayout = {
    paper_bgcolor: themeColors.bg,
    plot_bgcolor: themeColors.bg,
    font: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: themeColors.text,
        size: 11,
    },
    margin: { t: 30, r: 20, b: 40, l: 50 },
    xaxis: {
        gridcolor: themeColors.grid,
        linecolor: "#1e293b",
        tickfont: { color: themeColors.text },
    },
    yaxis: {
        gridcolor: themeColors.grid,
        linecolor: "#1e293b",
        tickfont: { color: themeColors.text },
    },
};

export const plotlyConfig = {
    displayModeBar: false,
    responsive: true,
};