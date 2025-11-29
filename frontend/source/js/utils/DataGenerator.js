class DataGenerator {
    static generatePriceData(days = 100) {
      const data = []
      let price = 95000
      const now = new Date()
  
      for (let i = days; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const change = (Math.random() - 0.5) * 500
        price += change
        price = Math.max(price, 50000)
  
        data.push({
          timestamp: date,
          date: date.toISOString().split("T")[0],
          price: Number.parseFloat(price.toFixed(2)),
          volume: Math.floor(Math.random() * 1000 + 500),
          open: price - Math.random() * 200,
          close: price,
          high: price + Math.random() * 300,
          low: price - Math.random() * 300,
        })
      }
  
      return this.addIndicators(data)
    }
  
    static addIndicators(data) {
      const ma50 = this.calculateMA(data, "price", 50)
      const rsi = this.calculateRSI(data, "price", 14)
  
      data.forEach((point, idx) => {
        point.ma_50 = ma50[idx]
        point.rsi = rsi[idx]
  
        // Bollinger Bands
        if (idx >= 20) {
          const prices = data.slice(idx - 19, idx + 1).map((p) => p.price)
          const mean = prices.reduce((a, b) => a + b) / prices.length
          const std = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length)
          point.boll_upper = mean + 2 * std
          point.boll_lower = mean - 2 * std
          point.boll_middle = mean
        }
      })
  
      return data
    }
  
    static calculateMA(data, field, period) {
      return data.map((_, idx) => {
        if (idx < period - 1) return null
        const sum = data.slice(idx - period + 1, idx + 1).reduce((acc, p) => acc + p[field], 0)
        return sum / period
      })
    }
  
    static calculateRSI(data, field, period = 14) {
      const rsi = []
      for (let i = 0; i < data.length; i++) {
        if (i < period) {
          rsi.push(null)
          continue
        }
  
        let gains = 0,
          losses = 0
        for (let j = i - period + 1; j <= i; j++) {
          const change = data[j][field] - data[j - 1][field]
          if (change > 0) gains += change
          else losses += Math.abs(change)
        }
  
        const rs = gains / period / (losses / period)
        const rsiValue = 100 - 100 / (1 + rs)
        rsi.push(isNaN(rsiValue) ? 50 : rsiValue)
      }
      return rsi
    }
  
    static calculateDPO(data, period = 20) {
      const dpo = []
      const shift = Math.floor(period / 2) + 1
  
      for (let i = 0; i < data.length; i++) {
        if (i < period + shift) {
          dpo.push(null)
          continue
        }
  
        const ma = this.calculateMA(data, "price", period)[i - shift]
        if (ma !== null) {
          dpo.push(data[i].price - ma)
        } else {
          dpo.push(null)
        }
      }
  
      return dpo
    }
  
    static generateCorrelationMatrix(timeframe) {
      const coins = ["BTC", "ETH", "BNB", "SOL", "USDT"]
      const correlations = [
        [1.0, 0.85, 0.7, 0.65, -0.2],
        [0.85, 1.0, 0.75, 0.72, -0.15],
        [0.7, 0.75, 1.0, 0.68, -0.1],
        [0.65, 0.72, 0.68, 1.0, -0.08],
        [-0.2, -0.15, -0.1, -0.08, 1.0],
      ]
  
      if (timeframe === "1m") {
        correlations.forEach((row) => {
          row.forEach((val, idx) => {
            if (val !== 1.0) row[idx] = val * 0.9
          })
        })
      }
  
      return { coins, correlations }
    }
}