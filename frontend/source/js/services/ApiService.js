class ApiService {
    static BASE_URL = "http://localhost:8002";

    // Hàm gọi API chung
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
    // 2. ANALYSIS PAGE API (Ráp đầy đủ 5 phần)
    // =======================================================
    static async getCoinHistory(coinId, timeframe = 'day', indicatorConfig= null) { 
        const coin = this.mapCoinToSymbol(coinId);
        if (timeframe=="day")
            indicatorConfig = 21;
        else if (timeframe=="week")
            indicatorConfig = 9;
        else if (timeframe=="month")
            indicatorConfig = 3;
        const [line, seasonal, scatter, histogram] =
            await Promise.all([
                this.getLineChartData(coin, timeframe),
                this.getSeasonalChartData(coin, timeframe, indicatorConfig),
                this.getScatterChartData(coin, timeframe),
                this.getHistogramChartData(coin, timeframe)
            ]);

        return {
            coin: coin,
            lineData: line,
            seasonalData: seasonal,
            scatterData: scatter,
            histogramData: histogram
        };
    }

    // =======================================================
    // 3. Micro-Endpoints (dùng 3 params đúng theo backend)
    // =======================================================
    static convertTimeframe(tf) {
        const map = {
            "1d": "day",
            "1w": "week",
            "1M": "month",
            "1m": "month",
            "day": "day",
            "week": "week",
            "month": "month",
        };
        return map[tf] || "day";
    }

    static async getLineChartData(coin, timeframe) {
        const t = this.convertTimeframe(timeframe);
        return await this.fetchFromApi(`/line-diagram?coin=${coin}&type=${t}`);
    }

    static async getScatterChartData(coin, timeframe) {
        const t = this.convertTimeframe(timeframe);
        return await this.fetchFromApi(`/scatter-diagram?coin=${coin}&type=${t}`);
    }

    static async getHistogramChartData(coin, timeframe) {
        const t = this.convertTimeframe(timeframe);
        return await this.fetchFromApi(`/histogram-diagram?coin=${coin}&type=${t}`);
    }

    static async getSeasonalChartData(coin, timeframe, indicatorConfig) {

        const t = this.convertTimeframe(timeframe);
        
        return await this.fetchFromApi(`/seasonal-diagram/dpo?coin=${coin}&interval=${t}&n=${indicatorConfig}`);
    }


    // =======================================================
    // 4. Utils
    // =======================================================
    static mapCoinToSymbol(coinId) {
        const map = {
            'bitcoin': 'bitcoin',
            'ethereum': 'ethereum',
            'dogecoin': 'dogecoin',
            'solana': 'solana',
            'tether': 'tether'
        };
        return map[coinId?.toLowerCase()] || coinId.toLowerCase();
    }
}
