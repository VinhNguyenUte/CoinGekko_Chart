class DataGenerator {
    static generatePriceData(days = 100) {
      const data = []
      let price = 95000
      const now = new Date()
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
      for (let i = days; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const change = (Math.random() - 0.5) * 500
        price += change
        price = Math.max(price, 50000)
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
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
<<<<<<< HEAD
      return this.addIndicators(data)
    }
    static addIndicators(data) {
      const ma50 = this.calculateMA(data, "price", 50)
      const rsi = this.calculateRSI(data, "price", 14)
      data.forEach((point, idx) => {
        point.ma_50 = ma50[idx]
        point.rsi = rsi[idx]
=======
  
      return this.addIndicators(data)
    }
  
    static addIndicators(data) {
      const ma50 = this.calculateMA(data, "price", 50)
      const rsi = this.calculateRSI(data, "price", 14)
  
      data.forEach((point, idx) => {
        point.ma_50 = ma50[idx]
        point.rsi = rsi[idx]
  
        // Bollinger Bands
>>>>>>> origin/master
        if (idx >= 20) {
          const prices = data.slice(idx - 19, idx + 1).map((p) => p.price)
          const mean = prices.reduce((a, b) => a + b) / prices.length
          const std = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length)
          point.boll_upper = mean + 2 * std
          point.boll_lower = mean - 2 * std
          point.boll_middle = mean
        }
      })
<<<<<<< HEAD
      return data
    }
=======
  
      return data
    }
  
>>>>>>> origin/master
    static calculateMA(data, field, period) {
      return data.map((_, idx) => {
        if (idx < period - 1) return null
        const sum = data.slice(idx - period + 1, idx + 1).reduce((acc, p) => acc + p[field], 0)
        return sum / period
      })
    }
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
    static calculateRSI(data, field, period = 14) {
      const rsi = []
      for (let i = 0; i < data.length; i++) {
        if (i < period) {
          rsi.push(null)
          continue
        }
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
        let gains = 0,
          losses = 0
        for (let j = i - period + 1; j <= i; j++) {
          const change = data[j][field] - data[j - 1][field]
          if (change > 0) gains += change
          else losses += Math.abs(change)
        }
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
        const rs = gains / period / (losses / period)
        const rsiValue = 100 - 100 / (1 + rs)
        rsi.push(isNaN(rsiValue) ? 50 : rsiValue)
      }
      return rsi
    }
<<<<<<< HEAD
    static calculateDPO(data, period = 20) {
      const dpo = []
      const shift = Math.floor(period / 2) + 1
=======
  
    static calculateDPO(data, period = 20) {
      const dpo = []
      const shift = Math.floor(period / 2) + 1
  
>>>>>>> origin/master
      for (let i = 0; i < data.length; i++) {
        if (i < period + shift) {
          dpo.push(null)
          continue
        }
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
        const ma = this.calculateMA(data, "price", period)[i - shift]
        if (ma !== null) {
          dpo.push(data[i].price - ma)
        } else {
          dpo.push(null)
        }
      }
<<<<<<< HEAD
      return dpo
    }
=======
  
      return dpo
    }
  
>>>>>>> origin/master
    static generateCorrelationMatrix(timeframe) {
      const coins = [
        "BTC", "ETH", "BNB", "SOL", "XRP", 
        "ADA", "DOGE", "AVAX", "DOT", "USDT"
      ]
      const correlations = [
<<<<<<< HEAD
             [1.00, 0.92, 0.85, 0.78, 0.65, 0.70, 0.55, 0.80, 0.72, -0.35],
             [0.92, 1.00, 0.88, 0.82, 0.68, 0.75, 0.58, 0.82, 0.75, -0.30],
             [0.85, 0.88, 1.00, 0.75, 0.60, 0.70, 0.50, 0.78, 0.70, -0.25],
             [0.78, 0.82, 0.75, 1.00, 0.55, 0.65, 0.48, 0.75, 0.68, -0.20],
             [0.65, 0.68, 0.60, 0.55, 1.00, 0.60, 0.45, 0.60, 0.55, -0.15],
             [0.70, 0.75, 0.70, 0.65, 0.60, 1.00, 0.52, 0.70, 0.65, -0.18],
             [0.55, 0.58, 0.50, 0.48, 0.45, 0.52, 1.00, 0.50, 0.45, -0.10],
             [0.80, 0.82, 0.78, 0.75, 0.60, 0.70, 0.50, 1.00, 0.78, -0.22],
             [0.72, 0.75, 0.70, 0.68, 0.55, 0.65, 0.45, 0.78, 1.00, -0.20],
             [-0.35,-0.30,-0.25,-0.20,-0.15,-0.18,-0.10,-0.22,-0.20, 1.00]
        ];
=======
            //        BTC   ETH   BNB   SOL   XRP   ADA   DOGE  AVAX  DOT   USDT
            /* BTC */ [1.00, 0.92, 0.85, 0.78, 0.65, 0.70, 0.55, 0.80, 0.72, -0.35],
            /* ETH */ [0.92, 1.00, 0.88, 0.82, 0.68, 0.75, 0.58, 0.82, 0.75, -0.30],
            /* BNB */ [0.85, 0.88, 1.00, 0.75, 0.60, 0.70, 0.50, 0.78, 0.70, -0.25],
            /* SOL */ [0.78, 0.82, 0.75, 1.00, 0.55, 0.65, 0.48, 0.75, 0.68, -0.20],
            /* XRP */ [0.65, 0.68, 0.60, 0.55, 1.00, 0.60, 0.45, 0.60, 0.55, -0.15],
            /* ADA */ [0.70, 0.75, 0.70, 0.65, 0.60, 1.00, 0.52, 0.70, 0.65, -0.18],
            /* DOGE*/ [0.55, 0.58, 0.50, 0.48, 0.45, 0.52, 1.00, 0.50, 0.45, -0.10],
            /* AVAX*/ [0.80, 0.82, 0.78, 0.75, 0.60, 0.70, 0.50, 1.00, 0.78, -0.22],
            /* DOT */ [0.72, 0.75, 0.70, 0.68, 0.55, 0.65, 0.45, 0.78, 1.00, -0.20],
            /* USDT*/ [-0.35,-0.30,-0.25,-0.20,-0.15,-0.18,-0.10,-0.22,-0.20, 1.00]
        ];
  
>>>>>>> origin/master
      if (timeframe === "1m") {
        correlations.forEach((row) => {
          row.forEach((val, idx) => {
            if (val !== 1.0) row[idx] = val * 0.9
          })
        })
      }
<<<<<<< HEAD
=======
  
>>>>>>> origin/master
      return { coins, correlations }
    }
}