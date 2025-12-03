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

    static async getCoinHistory(coinId, timeframe = 'day', indicatorConfig) { 

        const [line, seasonal, scatter, histogram, signal] = await Promise.all([
            this.getLineChartData(coinId, timeframe),
            this.getSeasonalChartData(coinId, timeframe, indicatorConfig),
            this.getScatterChartData(coinId, timeframe),
            this.getHistogramChartData(coinId, timeframe),
            this.getSignalData(coinId)
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

    static async getSignalData(coin, timeframe) {
        return await this.fetchFromApi(`/prediction?coin=${coin}`);
    }

    static async getLineChartData(coin, timeframe) {
        return await this.fetchFromApi(`/line-diagram?coin=${coin}&type=${timeframe}`);
    }

    static async getSeasonalChartData(coin, timeframe, indicatorConfig = 21) {
        const endpoint = `/seasonal-diagram/dpo?coin=${coin}&interval=${timeframe}&n=${indicatorConfig}`;
        return await this.fetchFromApi(endpoint);
    }

    static async getScatterChartData(coin, timeframe) {
        return await this.fetchFromApi(`/scatter-diagram?coin=${coin}&type=${timeframe}`);
    }

    static async getHistogramChartData(coin, timeframe) {
        return await this.fetchFromApi(`/histogram-diagram?coin=${coin}&type=${timeframe}`);
    }

}
