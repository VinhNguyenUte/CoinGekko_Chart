class ApiService {
    static BASE_URL = "https://e9771683-a681-4b84-9931-d992b713ce4b.mock.pstmn.io"; 

    // Hàm gọi API chung (Helper)
    static async fetchFromApi(endpoint) {
        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Lỗi gọi API:", error);
            return null; // Trả về null nếu lỗi để UI không bị crash
        }
    }

    // 1. Lấy dữ liệu Heatmap (Dashboard)
    static async getCorrelationMatrix(timeframe) {
        const data = await this.fetchFromApi(`/dashboard?type=${timeframe}`);
        
        if (data) {
            return {
                coins: data.labels,
                correlations: data.z_values
            };
        }
        return null;
    }

    // 2. Lấy dữ liệu chi tiết Coin (Analysis)
    static async getCoinHistory(coinId, timeframe = '1M') {
        console.log(`[API] Fetching History for ${coinId}...`);
        
        // Gọi API: /analysis/BTC?timeframe=1M
        // Lưu ý: coinId cần viết hoa nếu server yêu cầu (BTC thay vì bitcoin)
        const symbol = this.mapCoinToSymbol(coinId); 
        const data = await this.fetchFromApi(`/analysis/${symbol}?timeframe=${timeframe}`);
        
        if (data) {
            // API trả về cục to (lineData, scatterData...), ta cần parse nó ra
            // Tuy nhiên, logic cũ của App.js đang mong đợi một mảng giá (Price Array)
            // để vẽ chart. Ta cần trả về đúng định dạng cũ hoặc sửa App.js.
            // --> Cách tốt nhất: Trả về nguyên cục data API, App.js sẽ tự lấy cái cần.
            return data; 
        }
        return null;
    }

    // Helper: Chuyển tên coin sang Symbol (bitcoin -> BTC)
    static mapCoinToSymbol(coinId) {
        const map = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'bnb': 'BNB',
            'solana': 'SOL',
            'tether': 'USDT'
        };
        return map[coinId] || coinId.toUpperCase();
    }
}