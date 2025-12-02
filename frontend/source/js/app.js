class App {
  constructor() {
    this.currentPage = "dashboard";
    this.currentCoin = "bitcoin";

    this.dataCache = {
      dashboard: {},
      analysis: {}
    };

    this.dashboardTimeframe = "week";
    this.analysisTimeframe = "day";

    this.indicators = {
      ma: false,
      boll: false,
      rsi: true,
    };

    this.seasonalConfig = 21;

    this.updateTimer = null;
    this.UPDATE_INTERVAL = 5 * 60 * 1000;

    this.init();
  }

  async init() {
    this.setupEventListeners();

    await this.loadDashboardData();
    this.renderCurrentPage();

    this.startAutoUpdate();
  }
  // Setup Event Listener
  setupEventListeners() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        this.switchPage(page);
      });
    });

    document.querySelectorAll("#dashboard-page .timeframe-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll("#dashboard-page .timeframe-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        this.dashboardTimeframe = btn.dataset.timeframe;
        await this.loadDashboardData();
        this.renderDashboardPage();
      });
    });

    const globalRefreshBtn = document.getElementById("global-refresh-btn");
    if (globalRefreshBtn) {
      globalRefreshBtn.addEventListener("click", async () => {
        globalRefreshBtn.classList.add("is-loading");
        const originalText = globalRefreshBtn.querySelector(".label").textContent;
        globalRefreshBtn.querySelector(".label").textContent = "Updating...";

        try {
          console.log(`[Manual Refresh] Đang tải lại trang: ${this.currentPage.toUpperCase()}...`);
          if (this.currentPage === "analysis") {
            const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
            delete this.dataCache.analysis[cacheKey];

            await this.loadAnalysisData();
            this.renderAnalysisPage();

            const priceEl = document.getElementById("current-price");

            if (priceEl) {
              priceEl.style.color = "#00d084";
              setTimeout(() => priceEl.style.color = "", 500);
            }
          } else if (this.currentPage === "dashboard") {
            await this.loadDashboardData();
            this.renderDashboardPage();
          }

          this.startAutoUpdate();
        } catch (error) {
          console.error("Lỗi khi làm mới:", error);
        } finally {
          setTimeout(() => {
            globalRefreshBtn.classList.remove("is-loading");
            globalRefreshBtn.querySelector(".label").textContent = originalText;
          }, 500);
        }
      });
    }

    // Bộ lọc Analysis
    document.querySelectorAll("#analysis-page .tf-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll("#analysis-page .tf-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.analysisTimeframe = btn.dataset.timeframe;
        await this.loadAnalysisData();
        this.renderAnalysisPage();
      });
    });

    // Listener cho các nút DPO
    document.querySelectorAll(".dpo-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".dpo-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.seasonalConfig = btn.dataset.config;

        await this.reloadSeasonalDataOnly();
      });
    });

    // Chọn Coin (Watchlist) -> Tự chuyển sang trang Analysis
    document.querySelectorAll(".watchlist-item").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".watchlist-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        this.currentCoin = btn.dataset.coin;

        if (this.currentPage !== "analysis") {
          this.switchPage("analysis");
        } else {
          await this.loadAnalysisData();
          this.renderAnalysisPage();
        }
      });
    });
  }

  async loadDashboardData() {
    const matrix = await ApiService.getCorrelationMatrix(this.dashboardTimeframe);
    this.currentDashboardMatrix = matrix;
  }

  async loadAnalysisData() {
    const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
    const data = await ApiService.getCoinHistory(
      this.currentCoin,
      this.analysisTimeframe,
      this.seasonalConfig
    );
    if (data) {
      this.dataCache.analysis[cacheKey] = data;
    }
  }

  async switchPage(page) {
    this.currentPage = page;

    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    document.getElementById(`${page}-page`).classList.add("active");
    
    document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add("active");
    
    this.stopAutoUpdate();
    
    if (page === "analysis") {
      await this.loadAnalysisData();

      this.renderAnalysisPage();
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    } else {
      this.renderDashboardPage();
    }

    this.startAutoUpdate();
  }

  renderCurrentPage() {
    if (this.currentPage === "dashboard") this.renderDashboardPage();
    else this.renderAnalysisPage();
  }

  renderDashboardPage() {
    const matrixData = this.currentDashboardMatrix;

    if (!matrixData) {
      console.warn("Không có dữ liệu ma trận. Abort render.");
      return;
    }

    DashboardChart.renderCorrelationHeatmap(matrixData);
    console.log("------------------------------------------")
  }

  renderAnalysisPage() {
    const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
    const apiData = this.dataCache.analysis[cacheKey];

    if (!apiData) return;
    
    console.log(apiData)

    const coinNames = { bitcoin: "Bitcoin", ethereum: "Ethereum", bnb: "BNB", solana: "Solana", tether: "Tether" };
    const displayName = coinNames[this.currentCoin] || this.currentCoin.toUpperCase();
    
    document.getElementById("coin-name").textContent = displayName;
    
    TradingChart.render(apiData.lineData);
    SeasonalChart.render(apiData.seasonalData);
    VolumePriceChart.render(apiData.scatterData);
    DistributionChart.render(apiData.histogramData);
    
    console.log("------------------------------------------")
  }

  async reloadSeasonalDataOnly() {
    const chartDiv = document.getElementById("seasonal-chart");
    chartDiv.style.opacity = "0.5";
    
    try {
      const dpoData = await ApiService.getSeasonalChartData(
        this.currentCoin,
        this.analysisTimeframe,
        this.seasonalConfig
      );

      if (dpoData) {
        SeasonalChart.render(dpoData);
      }
    } catch (e) {
      console.error("Lỗi tải DPO:", e);
    } finally {
      chartDiv.style.opacity = "1";
    }
  }
  
  startAutoUpdate() {
    this.stopAutoUpdate();
    
    console.log(`[Auto-Update] Đã bật: Tự làm mới sau mỗi ${this.UPDATE_INTERVAL / 60000} phút.`);
    
    this.updateTimer = setInterval(async () => {
      const now = new Date().toLocaleTimeString();
      console.log(`[Auto-Update] 🔄 Đang cập nhật dữ liệu lúc ${now}...`);
      
      if (this.currentPage === "analysis") {
        const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
        delete this.dataCache.analysis[cacheKey];
        
        await this.loadAnalysisData();
        
        this.renderAnalysisPage();
        const priceEl = document.getElementById("current-price");
        
        if (priceEl) {
          priceEl.style.color = "#00d084";
          setTimeout(() => priceEl.style.color = "", 500);
        }
      }
      else if (this.currentPage === "dashboard") {
        await this.loadDashboardData();
        this.renderDashboardPage();
      }
    }, this.UPDATE_INTERVAL);
  };

  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App();
});
