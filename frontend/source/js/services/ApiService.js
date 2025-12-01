class ApiService {
    static BASE_URL = "https://e9771683-a681-4b84-9931-d992b713ce4b.mock.pstmn.io";

    // Hàm gọi API chung (Helper)
    static async fetchFromApi(endpoint) {
        try {
            console.log(`[API CALL] ${this.BASE_URL}${endpoint}`);
            const response = await fetch(`${this.BASE_URL}${endpoint}`);

            if (!response.ok) {
                console.warn(`[API ERROR] ${response.status} - ${endpoint}`);
                return null;
            }
            
            return response.json();
        } catch (error) {
            console.error("Lỗi kết nối API:", error);
            return null;
        }
    }

    // =======================================================
    // 1. DASHBOARD API
    // =======================================================
    static async getCorrelationMatrix(timeframe) {
        const data = await this.fetchFromApi(`/dashboard?type=${timeframe}`);
        if (data) {
            return { coins: data.labels, correlations: data.z_values };
        }
        return null;
    }

    // =======================================================
    // 2. ANALYSIS API (Hàm bạn đang bị thiếu)
    // =======================================================

    static async getCoinHistory(coinId, timeframe = '1M', indicatorConfig = 21) { 
        const symbol = this.mapCoinToSymbol(coinId);

        // Gọi song song 5 API nhỏ
        const [line, seasonal, scatter, histogram, signal] = await Promise.all([
            this.getLineChartData(symbol, timeframe),
            this.getSeasonalChartData(symbol, timeframe, indicatorConfig) // <- TRUYỀN 3 THAM SỐ VÀO ĐÂY
            // this.getScatterChartData(symbol, timeframe),
            // this.getHistogramChartData(symbol, timeframe),
            // this.getSignalData(symbol, timeframe),
        ]);

        return {
            coin: symbol,
            lineData: line,
            seasonalData: seasonal,
            scatterData: scatter,
            histogramData: histogram,
            signalData: signal
        };
    }

    // =======================================================
    // 2. MICRO-ENDPOINT FUNCTIONS (Sử dụng 3 tham số)
    // =======================================================

    // Line Chart (Chỉ cần 2 params)
    static async getLineChartData(coin, timeframe) {
        return await this.fetchFromApi(`/analysis/line?coin=${coin}&timeframe=${timeframe}`);
    }

    // Seasonal Chart (Cần đủ 3 params để khớp với URL trong hình)
    static async getSeasonalChartData(coin, timeframe, indicatorConfig = 21) {
        // [FIX] Cấu hình URL để có đủ 3 params
        const endpoint = `/analysis/seasonal?coin=${coin}&timeframe=${timeframe}&indicator_config=${indicatorConfig}`;
        return await this.fetchFromApi(endpoint);
    }
    
    // Scatter Chart (Chỉ cần 2 params)
    static async getScatterChartData(coin, timeframe) {
        return await this.fetchFromApi(`/charts/scatter?coin=${coin}&timeframe=${timeframe}`);
    }

    // Histogram Chart (Chỉ cần 2 params)
    static async getHistogramChartData(coin, timeframe) {
        return await this.fetchFromApi(`/charts/histogram?coin=${coin}&timeframe=${timeframe}`);
    }

    // Signal Card (Chỉ cần 2 params)
    static async getSignalData(coin, timeframe) {
        return await this.fetchFromApi(`/signal?coin=${coin}&timeframe=${timeframe}`);
    }

    // =======================================================
    // 3. UTILS
    // =======================================================
    static mapCoinToSymbol(coinId) {
        if (!coinId) return 'BTC';
        const map = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'bnb': 'BNB',
            'solana': 'SOL',
            'tether': 'USDT'
        };
        return map[coinId.toLowerCase()] || coinId.toUpperCase();
    }
}