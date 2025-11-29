class ApiService {
    // Mô phỏng độ trễ mạng (Network Latency) là 500ms
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async getCoinHistory(coinId, days = 100) {
        // Sau này thay bằng: const response = await fetch(`/api/coins/${coinId}/history`);
        await this.delay(500); 
        console.log(`[API] Fetched history for ${coinId}`);
        return DataGenerator.generatePriceData(days);
    }

    static async getCorrelationMatrix(timeframe) {
        // Sau này thay bằng: const response = await fetch(`/api/correlations?timeframe=${timeframe}`);
        await this.delay(300);
        console.log(`[API] Fetched correlation matrix for ${timeframe}`);
        return DataGenerator.generateCorrelationMatrix(timeframe);
    }
}