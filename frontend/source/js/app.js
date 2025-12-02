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
    const signalData = apiData.signalData;

    console.log(apiData)

    if (!apiData) return;

    if (signalData) {
        // --- Mapping UI Elements ---
        const elName = document.getElementById('coin-name');
        const elSymbol = document.getElementById('detail-symbol');
        const elCurrentPrice = document.getElementById('detail-current-price');
        const elSignalCard = document.getElementById('ai-signal-card');
        const elSignalText = document.getElementById('signal-text');
        const elSignalDate = document.getElementById('signal-date');
        const elConfidence = document.getElementById('signal-confidence');
        const elProgress = document.getElementById('signal-progress');
        const elPredPrice = document.getElementById('detail-predicted-price');
        const elFactors = document.getElementById('signal-factors');

        // --- Điền dữ liệu ---
        elName.textContent = this.currentCoin.toUpperCase(); // Hoặc lấy từ signalData.coin_id
        elSymbol.textContent = (signalData.coin_id || this.currentCoin).toUpperCase();
        
        // Format tiền tệ ($87,156.08)
        const fmtPrice = (price) => `$${Number(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        elCurrentPrice.textContent = fmtPrice(signalData.current_price);
        elPredPrice.textContent = fmtPrice(signalData.predicted_price);
        
        // Xử lý màu sắc Tín hiệu (Signal)
        elSignalCard.className = 'ai-signal-box'; // Reset class
        const sig = signalData.signal.toUpperCase(); // "SELL"
        elSignalText.textContent = sig;
        
        if (sig === 'BUY' || sig === 'STRONG BUY') elSignalCard.classList.add('buy');
        else if (sig === 'SELL' || sig === 'STRONG SELL') elSignalCard.classList.add('sell');
        else elSignalCard.classList.add('neutral');

        // Xử lý Confidence & Date
        elConfidence.textContent = `${signalData.confidence}%`;
        elProgress.style.width = `${signalData.confidence}%`;
        
        // Format ngày (YYYY-MM-DD -> DD/MM/YYYY)
        const dateObj = new Date(signalData.prediction_target_date);
        elSignalDate.textContent = dateObj.toLocaleDateString('en-GB'); // 03/12/2025

        elFactors.innerHTML = signalData.factors.replace('|', '<br/>');

        if (signalData.created_at) {
            const creationDate = new Date(signalData.created_at);

            // Định dạng: VD 12/02/2025 11:12 AM
            const formattedDate = `${creationDate.toLocaleDateString()} ${creationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            // Tìm và cập nhật element trong UI (Sử dụng ID mới)
            const dateEl = document.getElementById("signal-created-at");
            
            if (dateEl) {
                dateEl.textContent = formattedDate; // Không cần "Generated" vì đã có label
            }
        }
    }

    const coinNames = { bitcoin: "Bitcoin", ethereum: "Ethereum", bnb: "BNB", solana: "Solana", tether: "Tether" };
    const displayName = coinNames[this.coin_id];
    document.getElementById("coin-name").textContent = displayName;

    SignalCard.render(apiData.signalData);
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
