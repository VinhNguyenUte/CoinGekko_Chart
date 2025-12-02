class ApiService {
    static BASE_URL = "http://localhost:8002";

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

    static async getCorrelationMatrix(timeframe) {
        const data = await this.fetchFromApi(`/dashboard?type=${timeframe}`);
        
        if (data) {
            return { coins: data.labels, correlations: data.z_values };
        }

        return null;
    }

    static async getCoinHistory(coinId, timeframe = 'day', indicatorConfig = 21) { 
        if (timeframe=="day")
            indicatorConfig = 21;
        else if (timeframe=="week")
            indicatorConfig = 9;
        else if (timeframe=="month")
            indicatorConfig = 3;
        
        const [line, seasonal, scatter, histogram, signal] = await Promise.all([
            this.getLineChartData(coinId, timeframe),
            this.getSeasonalChartData(coinId, timeframe, indicatorConfig),
            this.getScatterChartData(coinId, timeframe),
            this.getHistogramChartData(coinId, timeframe)
        ]);

        return {
            coin: coinId,
            lineData: line,
            seasonalData: seasonal,
            scatterData: scatter,
            histogramData: histogram,
            signalData: signal
        };
    }

    static async getLineChartData(coin, timeframe) {
        return await this.fetchFromApi(`/analysis/line?coin=${coin}&timeframe=${timeframe}`);
    }

    static async getSeasonalChartData(coin, timeframe, indicatorConfig = 21) {
        const endpoint = `/analysis/seasonal?coin=${coin}&timeframe=${timeframe}&indicator_config=${indicatorConfig}`;
        return await this.fetchFromApi(endpoint);
    }

    static async getScatterChartData(coin, timeframe) {
        return await this.fetchFromApi(`/analysis/scatter?coin=${coin}&timeframe=${timeframe}`);
    }

    static async getHistogramChartData(coin, timeframe) {
        return await this.fetchFromApi(`/analysis/histogram?coin=${coin}&timeframe=${timeframe}`);
    }
    
    static async getSignalData(coin, timeframe) {
        return await this.fetchFromApi(`/analysis?coin=${coin}&timeframe=${timeframe}`);
    }
}