class App {
  constructor() {
    this.currentPage = "dashboard";
    this.currentCoin = "bitcoin";

    // Cache dữ liệu để không phải gọi lại API liên tục
    this.dataCache = {
      dashboard: {},
      analysis: {}
    };

    this.dashboardTimeframe = "week"; // Mặc định 1 tháng
    this.analysisTimeframe = "1h";  // Mặc định 1 giờ cho chart chi tiết

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

    // Mặc định vào Dashboard -> Load data Dashboard
    await this.loadDashboardData();
    this.renderCurrentPage();

    this.startAutoUpdate();
  }

  // --- 1. SETUP EVENT LISTENERS ---
  setupEventListeners() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        this.switchPage(page);
      });
    });

    document.querySelectorAll("#dashboard-page .timeframe-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        // Update UI active
        document.querySelectorAll("#dashboard-page .timeframe-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Update state & reload
        this.dashboardTimeframe = btn.dataset.timeframe;
        await this.loadDashboardData();
        this.renderDashboardPage();
      });
    });

    const globalRefreshBtn = document.getElementById("global-refresh-btn");

    if (globalRefreshBtn) {
      globalRefreshBtn.addEventListener("click", async () => {
        // 1. UI Loading
        globalRefreshBtn.classList.add("is-loading");
        const originalText = globalRefreshBtn.querySelector(".label").textContent;
        globalRefreshBtn.querySelector(".label").textContent = "Updating...";

        try {
          console.log(`[Manual Refresh] Đang tải lại trang: ${this.currentPage.toUpperCase()}...`);

          // 2. Logic xử lý theo từng trang
          if (this.currentPage === "analysis") {
            // Trang Analysis: Phải xóa cache
            const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
            delete this.dataCache.analysis[cacheKey];

            await this.loadAnalysisData();
            this.renderAnalysisPage();

            // Hiệu ứng nháy giá
            const priceEl = document.getElementById("current-price");
            if (priceEl) {
              priceEl.style.color = "#00d084";
              setTimeout(() => priceEl.style.color = "", 500);
            }

          } else if (this.currentPage === "dashboard") {
            // Trang Dashboard: Load lại Matrix
            await this.loadDashboardData();
            this.renderDashboardPage();
          }

          // 3. QUAN TRỌNG: Reset lại đồng hồ đếm ngược
          // Để tránh việc vừa bấm xong 10s sau nó lại tự update
          this.startAutoUpdate();

        } catch (error) {
          console.error("Lỗi khi làm mới:", error);
        } finally {
          // 4. Reset UI (delay nhẹ để người dùng cảm nhận được)
          setTimeout(() => {
            globalRefreshBtn.classList.remove("is-loading");
            globalRefreshBtn.querySelector(".label").textContent = originalText;
          }, 500);
        }
      });
    }

    // Bộ lọc Analysis (Timeframe Chart)
    document.querySelectorAll("#analysis-page .tf-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll("#analysis-page .tf-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        this.analysisTimeframe = btn.dataset.timeframe;
        await this.loadAnalysisData(); // Reload data mới
        this.renderAnalysisPage();     // Vẽ lại chart
      });
    });

    // Listener cho các nút DPO
    document.querySelectorAll(".dpo-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        // 1. Logic UI: Tắt active cũ, bật active mới (Radio behavior)
        document.querySelectorAll(".dpo-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // 2. Update State
        this.seasonalConfig = btn.dataset.config;

        // 3. Gọi API và vẽ lại riêng chart này
        await this.reloadSeasonalDataOnly();
      });
    });

    // Chọn Coin (Watchlist) -> Tự chuyển sang trang Analysis
    document.querySelectorAll(".watchlist-item").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".watchlist-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        this.currentCoin = btn.dataset.coin; // bitcoin, ethereum...

        // Nếu đang ở Dashboard thì chuyển sang Analysis
        if (this.currentPage !== "analysis") {
          this.switchPage("analysis");
        } else {
          // Đang ở Analysis rồi thì chỉ cần reload data
          await this.loadAnalysisData();
          this.renderAnalysisPage();
        }
      });
    });
  }

  // --- 2. LOAD DATA (GỌI API SERVICE) ---

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

  // --- 3. NAVIGATION & RENDER ---
  async switchPage(page) {
    this.currentPage = page;

    // Ẩn hiện Page
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    document.getElementById(`${page}-page`).classList.add("active");

    // Active Menu Item
    document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add("active");

    this.stopAutoUpdate();

    // Render nội dung trang tương ứng
    if (page === "analysis") {
      // Nếu chưa có data của coin hiện tại thì load
      await this.loadAnalysisData();
      this.renderAnalysisPage();

      // Resize chart để không bị méo
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
      // Nếu là lần load đầu tiên bị lỗi API thì không vẽ
      console.warn("Không có dữ liệu ma trận. Abort render.");
      return;
    }

    // [SỬA 3] Xóa hết logic đọc cache cũ và gọi hàm render ngay
    DashboardChart.renderCorrelationHeatmap(matrixData);

    console.log("------------------------------------------")
  }

  renderAnalysisPage() {
    const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
    const apiData = this.dataCache.analysis[cacheKey];

    if (!apiData) return;
    console.log(apiData)

    // 1. Update Header Info
    const coinNames = { bitcoin: "Bitcoin", ethereum: "Ethereum", bnb: "BNB", solana: "Solana", tether: "Tether" };
    const displayName = coinNames[this.currentCoin] || this.currentCoin.toUpperCase();

    document.getElementById("coin-name").textContent = displayName;

    // Lấy giá mới nhất
    // const latestPrice = rowBasedData[rowBasedData.length - 1].price;
    // document.getElementById("current-price").textContent = `$${latestPrice.toLocaleString()}`;


    // 2. Render Charts

    // A. Trading Chart (Line + RSI)
    const chartPayload = {
      ...apiData.lineData.lineData,

      meta: {
        timeframe: this.analysisTimeframe,
        indicators: this.indicators
      }
    };
    TradingChart.render(chartPayload);

    // B. Seasonal Chart (DPO) - Truyền data đã map
    SeasonalChart.render(apiData.seasonalData);

    // C. Scatter Chart (Volume-Price Correlation) - Truyền data đã map
    VolumePriceChart.render(apiData.scatterData); 

    // D. Distribution Chart (Return Distribution) - Truyền data đã map
    // DistributionChart.render(rowBasedData); 

    console.log("------------------------------------------")
  }

  async reloadSeasonalDataOnly() {
    // Hiển thị loading nhẹ hoặc làm mờ chart (Optional)
    const chartDiv = document.getElementById("seasonal-chart");
    chartDiv.style.opacity = "0.5";

    try {
      // Gọi trực tiếp Micro-Endpoint của Seasonal
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
    // 1. Dọn dẹp timer cũ (nếu có) để an toàn
    this.stopAutoUpdate();

    console.log(`[Auto-Update] Đã bật: Tự làm mới sau mỗi ${this.UPDATE_INTERVAL / 60000} phút.`);

    // 2. Thiết lập vòng lặp vô tận
    this.updateTimer = setInterval(async () => {
      const now = new Date().toLocaleTimeString();
      console.log(`[Auto-Update] 🔄 Đang cập nhật dữ liệu lúc ${now}...`);

      if (this.currentPage === "analysis") {
        // [QUAN TRỌNG] Phải xóa Cache cũ, nếu không hàm loadAnalysisData sẽ trả về dữ liệu cũ
        const cacheKey = `${this.currentCoin}_${this.analysisTimeframe}`;
        delete this.dataCache.analysis[cacheKey];

        // Tải lại data mới từ API
        await this.loadAnalysisData();

        // Vẽ lại biểu đồ
        this.renderAnalysisPage();

        // (Optional) Hiệu ứng nháy xanh giá tiền để báo hiệu
        const priceEl = document.getElementById("current-price");
        if (priceEl) {
          priceEl.style.color = "#00d084";
          setTimeout(() => priceEl.style.color = "", 500);
        }
      }
      else if (this.currentPage === "dashboard") {
        // Dashboard thường không cần cache chặt, gọi thẳng hàm load
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

