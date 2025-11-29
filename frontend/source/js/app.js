class App {
  constructor() {
    this.currentPage = "dashboard"
    this.currentCoin = "bitcoin"
    this.data = {} // Cache dữ liệu
    this.indicators = {
      ma: true,
      boll: true,
      rsi: true,
      volume: false,
    }
    this.init()
  }

  async init() {
    this.setupEventListeners()
    await this.loadInitialData() // Chuyển thành hàm async
    this.renderCurrentPage()
  }

  // Giả lập việc tải dữ liệu ban đầu từ API
  async loadInitialData() {
    console.log("Loading data...")
    // Dùng Promise.all để tải song song, tiết kiệm thời gian
    const [btc, eth, bnb, sol, corr1w, corr1m] = await Promise.all([
      ApiService.getCoinHistory("bitcoin"),
      ApiService.getCoinHistory("ethereum"),
      ApiService.getCoinHistory("bnb"),
      ApiService.getCoinHistory("solana"),
      ApiService.getCorrelationMatrix("1w"),
      ApiService.getCorrelationMatrix("1m"),
    ])

    this.data.bitcoin = btc
    this.data.ethereum = eth
    this.data.bnb = bnb
    this.data.solana = sol
    this.data.correlations_1w = corr1w
    this.data.correlations_1m = corr1m
    console.log("Data loaded complete.")
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.switchPage(btn.dataset.page)
      })
    })

    // Dashboard filters
    document.querySelectorAll(".timeframe-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.handleDashboardFilter(btn))
    })

    // Indicator toggles
    document.querySelectorAll(".indicator-toggle").forEach((btn) => {
      btn.addEventListener("click", () => this.handleIndicatorToggle(btn))
    })

    // Watchlist
    document.querySelectorAll(".watchlist-item").forEach((btn) => {
      btn.addEventListener("click", () => this.selectCoin(btn))
    })
  }

  selectCoin(button) {
    document.querySelectorAll(".watchlist-item").forEach((b) => b.classList.remove("active"))
    button.classList.add("active")

    this.currentCoin = button.dataset.coin
    if (this.currentPage === "analysis") {
      this.renderAnalysisPage()
    }
  }

  handleIndicatorToggle(button) {
    const indicator = button.dataset.indicator
    this.indicators[indicator] = !this.indicators[indicator]
    button.classList.toggle("active")

    if (this.currentPage === "analysis") {
      const data = this.data[this.currentCoin]
      // Chỉ render lại biểu đồ giá khi toggle indicator
      TradingChart.renderPrice(data, this.indicators)
      TradingChart.renderRSI(data, this.indicators)
    }
  }

  handleDashboardFilter(button) {
    document.querySelectorAll(".timeframe-btn").forEach((b) => b.classList.remove("active"))
    button.classList.add("active")
    this.renderDashboardPage()
  }

  switchPage(page) {
    this.currentPage = page

    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"))
    document.getElementById(`${page}-page`).classList.add("active")

    document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add("active")

    if (page === "analysis") {
      this.renderAnalysisPage()
      
      // [FIX MỚI] Ép trình duyệt tính toán lại kích thước chart sau khi Tab hiện ra
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50); // Chỉ cần delay cực ngắn
    } else {
      this.renderDashboardPage()
    }
  }

  renderCurrentPage() {
    if (this.currentPage === "dashboard") {
      this.renderDashboardPage()
    } else {
      this.renderAnalysisPage()
    }
  }

  renderDashboardPage() {
    const activeFilter = document.querySelector(".timeframe-btn.active")
    const timeframe = activeFilter ? activeFilter.dataset.timeframe : "1w"
    const matrixKey = `correlations_${timeframe}`
    
    // Check nếu chưa có data (trường hợp load lỗi hoặc chưa xong)
    if (!this.data[matrixKey]) return;

    DashboardChart.renderCorrelationHeatmap(this.data[matrixKey])
  }

  renderAnalysisPage() {
    const data = this.data[this.currentCoin]
    if (!data) return;

    const coinNames = { bitcoin: "Bitcoin", ethereum: "Ethereum", bnb: "BNB", solana: "Solana" }
    document.getElementById("coin-name").textContent = coinNames[this.currentCoin] || "Bitcoin"
    document.getElementById("current-price").textContent = `$${data[data.length - 1].price.toLocaleString()}`

    // Render Main Chart
    TradingChart.render(data, this.indicators);
    
    // Render 3 Chart nhỏ
    VolumePriceChart.render(data)
    DistributionChart.render(data)
    SeasonalChart.render(data)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App()
})