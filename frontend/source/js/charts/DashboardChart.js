class DashboardChart {
    static renderCorrelationHeatmap(matrix) {
      const trace = {
        z: matrix.correlations,
        x: matrix.coins,
        y: matrix.coins,
        type: "heatmap",
        colorscale: "RdBu",
        zmid: 0,
        zmin: -1,
        zmax: 1,
        hovertemplate: "Correlation between %{y} and %{x}: %{z:.2f}<extra></extra>",
        colorbar: { title: "Correlation", thickness: 20, len: 0.7 },
      }
  
      const layout = {
        title: { text: "Cross-Asset Correlation Matrix", x: 0.02 },
        margin: { l: 100, r: 100, t: 80, b: 80 },
        paper_bgcolor: "#1a1f2e",
        plot_bgcolor: "#1a1f2e",
        font: { color: "#e3e8ef" },
        xaxis: { side: "bottom" },
      }
  
      Plotly.newPlot("correlation-heatmap", [trace], layout, { responsive: true })
    }
}