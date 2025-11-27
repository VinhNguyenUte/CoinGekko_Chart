# Phân tích sơ đồ

## LineDiagram: 
### Tên biểu đồ: Price Trend & Prediction Chart (Biểu đồ xu hướng giá & Dự báo).
### Mục đích : xem lịch sử giá đóng cửa theo thời gian, chỉ báo của giá (MSI, MA, ...)
### Ý nghĩa: 
- Phân tích giá biến động theo xu hướng nào trong bộ lọc thời gian 
- Dự đoán giá sẽ biến động như thế nào trong các điểm tiếp theo tiếp theo (tùy dữ liệu api trả về là dự đoán 1d, 1w, 1M)
### Bộ lọc: coin, thời gian (1D - 1W - 1M)
### Thể hiện: 
- Trục X(thời gian), trục Y(giá)
- Hiện NHIỀU line trên nhiều ô giao diện (lọc từ coin -> time), với các line có thể gồm đường giá, đường RSI, đường MA, đường BOLL, ...(việc hiện lên tùy thuộc vào chọn lựa của user) 
### Dữ liệu nhận: 
- Tên coin
- Thời gian (theo bộ lọc thời gian [hh:mm nếu theo ngày - dd/mm nếu theo tuần và tháng]) + Giá tương ứng	
- Thời gian dự đoán + giá dự đoán
- Các giá trị của chỉ báo
### Công thức tính toán:
- Đường giá: Lấy trực tiếp từ giá đóng cửa hoặc giá mở cửa.
- MA (Moving Average): MA = (P1 + P2 + ... + Pn) / n
- Bollinger Bands: 
	+ Dải giữa (Middle Band): Chính là đường MA (thường là MA20)
	+ Độ lệch chuẩn(std_dev): SQRT(SUM((Price_i - MA)^2) / N)
	+ Dải trên (Upper Band): MA + (2 * std_dev)
	+ Dải dưới (Lower Band): MA - (2 * std_dev)
- RSI (Relative Strength Index - Đo tốc độ và sự thay đổi của biến động giá): 100 - (100 / (1 + RS)) [Trong đó RS là tỷ lệ trung bình tăng / trung bình giảm]
### Dữ liệu lý tưởng: 
```json
		{
  			// PHẦN 1: Dữ liệu Lịch sử & Chỉ báo (Chứa tất cả số liệu đã tính toán từ Backend)
  			"history": [
    			{
      				"timestamp": "2023-11-20T10:00:00Z",
      				"price": 95000,
      
      				// Chỉ báo vẽ ĐÈ lên biểu đồ giá (Overlay)
      				"ma_50": 94800,          // Đường trung bình động 50
      				"boll": {                // Bollinger Bands
          				"upper": 96000,      // Dải trên
          				"lower": 94000       // Dải dưới
      				},

      				// Chỉ báo vẽ RIÊNG ở biểu đồ dưới (Subplot)
      				"rsi": 45.5              // RSI (0 - 100)
    			},
    			{
      				"timestamp": "2023-11-20T11:00:00Z",
      				"price": 95200,
      				"ma_50": 94850,
      				"boll": { "upper": 96100, "lower": 94100 },
      				"rsi": 55.2 
    			},
    			// ... hàng trăm điểm dữ liệu tiếp theo ...
    			{
      				"timestamp": "2023-11-27T10:00:00Z", // Điểm hiện tại
      				"price": 96000,
      				"ma_50": 95500,
      				"boll": { "upper": 97000, "lower": 95000 },
      				"rsi": 72.0 // Đang ở vùng quá mua
    			}
  		],

  		// PHẦN 2: Dữ liệu Dự báo (Chỉ dự báo Giá, không dự báo chỉ báo)
  		"forecast": {
    			"timestamp": "2023-11-28T10:00:00Z",
    			"price": 97500,
    			"confidence": "high"
  		}
	}
```
### Chi tiết sơ đồ:
- 1 đường màu xanh biểu thị lịch sử giá coin đã trải qua
- 1 đường màu cam biểu thị giá coin dự đoán sau khi phân tích (đường này vẽ nối tiếp từ đường màu xanh có trước)
- Các đường khác màu biểu thị ở biểu đồ giá tùy vào dữ liệu api trả về
- 1 đường RSI biểu thị riêng ở 1 biểu đồ ngay dưới biểu đồ giá
- Cho phép zoom in/out
### Bố cục giao diện:
```text
---------------------------------------------------------
|  [HEADER] : Logo | Tên Coin (BTC) | Giá Hiện Tại ($96k)|
---------------------------------------------------------
|  [TOOLBAR - Bộ lọc & Tùy chọn hiển thị]               |
|  Time: [1D] [1W] [1M]  |  Indicators: [x] MA [x] BOLL |
---------------------------------------------------------
|                                                       |
|  [MAIN CHART AREA - Plotly Div]                       |
|  --------------------------------------------------   |
|  |  (Vùng 1: Chiếm 75% chiều cao)                 |   |
|  |  Vẽ: Line Giá (Xanh) + Dự báo (Cam)            |   |
|  |      + MA (Vàng) + BOLL (Nền xanh nhạt)        |   |
|  --------------------------------------------------   |
|  |  (Vùng 2: Chiếm 25% chiều cao)                 |   |
|  |  Vẽ: RSI (Tím) - Có 2 vạch kẻ ngang 30-70      |   |
|  --------------------------------------------------   |
|                                                       |
---------------------------------------------------------
|  [FOOTER - Thông tin dự báo chi tiết]                 |
|  "AI dự báo ngày mai: $97,500 (Độ tin cậy: Cao)"      |
---------------------------------------------------------
```
_________________________________________________________________________________________________________________

## ScatterDiagram:
### Tên biểu đồ: Volume-Price Correlation Scatter (Biểu đồ tương quan thanh khoản - Giá)
### Mục đích : 
- Biến động giá có được xác nhận bởi thanh khoản (Volume)
- Phát hiện điểm bất thường
### Ý nghĩa: chia làm 4 phần
- Góc trên - phải: Giá Tăng mạnh + Volume Cao -> Xu hướng tăng bền vững (UpTrend)
- Góc dưới - phải: Giá Giảm mạnh + Volume Cao -> Xu hướng bán tháo (DownTrend)
- Góc trên - trái: Giá Tăng + Volume Thấp -> Cẩn trọng bẫy tăng giá
- Góc dưới - trái: Giá Giảm + Volume Thấp -> Thị trường thiếu quan tâm
### Bộ lọc: coin , thời gian (1D - 1W - 1M)
### Thể hiện: 
- Trục X (tổng thanh khoản (volume)), trục Y (biến động giá trong ngày)
### Dữ liệu nhận:
- Tên coin
- Thời gian (theo bộ lọc thời gian [dd/mm theo tuần và tháng]) + % biến động giá của ngày tương ứng (price_change_percentage_24h)
- Thông số đường xu hướng(Slope & Intercept).
### Công thức tính toán:
- Trục Y (% Biến động): 
	+ Theo ngày: ((Giá đóng cửa hôm nay hoặc giá hiện tại - Giá đóng cửa hôm qua) / Giá đóng cửa hôm qua) * 100
	+ Theo giờ: ((Giá đóng cửa trong giờ hoặc giá hiện tại - Giá mở cửa trong giờ) / Giá mở cửa trong giờ) * 100
### Dữ liệu lý tưởng:
```json
		{
  			"points": [  // Dùng để vẽ CHẤM TRÒN (Markers)
    				{ "volume": 100, "change": 2.0, "date": "2023-11-25" },
    				{ "volume": 500, "change": 5.5, "date": "2023-11-24" },
    				{ "volume": 300, "change": 3.1, "date": "2023-11-23" }
    				// ...	
  			],
  			"trendline": { // Dùng để vẽ ĐƯỜNG (Line)
    				"slope": 0.009,      // Hệ số góc (a)
    				"intercept": 1.1     // Hệ số chặn (b)
    				// Nghĩa là: y = 0.009 * x + 1.1
 			}
		}
```
### Chi tiết sơ đồ:
- Các điểm (market) tương ứng (x,y) với (volume, % biến động trong ngày); đơn vị điểm là giờ nếu lọc 1day, là ngày nếu bộ lọc 1W hay 1M. Trỏ vào market nào thì nó sẽ show thêm datetime của market đó
- 1 đường (đường xu hướng) (KHÔNG PHẢI LÀ ĐƯỜNG NỐI CÁC ĐIỂM VỚI NHAU). Đường này là công thức toán học: y = ax + b (với a là hệ số góc: slope và b là hệ số chặn: intercept), là đường đi xuyên qua đám mây điểm
### Bố cục giao diện: 
```text
-----------------------------------------------------------------------------------------
|  [HEADER] : Logo | Tên Coin (BTC) | Giá Hiện Tại ($96k)                               |
-----------------------------------------------------------------------------------------
|  [TITLE BAR]                                                                          |
|  📊 Tương quan Thanh khoản & Giá (Volume Spread Analysis)            [?] Hướng dẫn    |
-----------------------------------------------------------------------------------------
|  [TOOLBAR - Bộ lọc]                                                                   |
|  Thời gian: [1D] [1W] [1M]      |     Tùy chọn: [x] Hiện đường xu hướng (Trendline)   |
-----------------------------------------------------------------------------------------
|                                                                                       |
|  [MAIN CHART AREA - Plotly Div]                                                       |
|                                                                                       |
|      ^ (% Biến động giá - Trục Y)                                                     |
|      |                                                                                |
|  +10%|      [VÙNG 3: BẪY TĂNG GIÁ]           |      [VÙNG 1: XÁC NHẬN TĂNG]           |
|      |      (Giá tăng - Vol thấp)            |      (Giá tăng - Vol cao)              |
|      |           .    .                      |             o   o  o                   |
|      |         .                             |           o   o /  o                   |
|      |                                       |         o     /                        |
|   0% |---------------------------------------+-------------/---------------------->   |
|      |                                       |           /                            |
|      |         .    .                        |         /   x   x                      |
|      |       .   .                           |       /   x                            |
|      |      [VÙNG 4: ẢM ĐẠM]                 |      [VÙNG 2: XẢ HÀNG]                 |
|      |      (Giá giảm - Vol thấp)            |      (Giá giảm - Vol cao)              |
|  -10%|                                       |                                        |
|      |_______________________________________|______________________________________  |
|     0              Thấp                    TB                  Cao             (Volume)
|                                                                                       |
-----------------------------------------------------------------------------------------
|  [LEGEND & STATUS - Chú thích trạng thái thị trường]                                  |
|                                                                                       |
|  🔴 Đường Xu Hướng (Trendline): Đang dốc lên ↗️ => Dòng tiền ủng hộ Tăng giá.        |
|  ⚫ Điểm (Market):                                                                    |
|     o (Góc phải trên): Dòng tiền mạnh, giá tăng (Tốt).                                |
|     x (Góc phải dưới): Bán tháo hoảng loạn (Xấu).                                     |
-----------------------------------------------------------------------------------------
```
_________________________________________________________________________________________________________________

## HistogramDiagram:
### Tên biểu đồ: Return Distribution Histogram (Biểu đồ phân phối lợi nhuận).
### Mục đích : 
- Đánh giá mức độ ổn định hoặc rủi ro của đồng coin.
- Xem tần suất xuất hiện của các đợt tăng/giảm giá mạnh.
### Ý nghĩa: 
- Đỉnh cao ở giữa (quanh số 0%): Coin ổn định, ít biến động (thường là Stablecoin hoặc Sideway).
- Biểu đồ bè rộng sang 2 bên: Coin biến động mạnh, rủi ro cao (High Volatility).
- Đuôi dài về bên trái (Fat Tail): Cảnh báo rủi ro sập giá mạnh (Black Swan) đã từng xảy ra.
### Bộ lọc: coin , thời gian (1D - 1W - 1M) 
### Thể hiện: 
- Trục X (Mức lợi nhuận hàng ngày (%R)), trục Y (Số ngày xuất hiện (Frequency))
### Dữ liệu nhận:
- Tên coin
- Mảng chứa % lợi nhuận của từng ngày (Daily Returns).
- Các thông số thống kê cơ bản (nếu backend tính sẵn): Mean (Trung bình), Std Dev (Độ lệch chuẩn).
### Công thức tính toán
- Daily Returns: (Giá hôm nay - Giá hôm qua) / Giá hôm qua x 100
- Stats:
	+ mean (Trung bình cộng): SUM(%R từng ngày) / Tổng số ngày
	+ std_dev (Độ lệch chuẩn): SQRT((SUM((%R - mean)^2)) / (N - 1))
	+ max_drawdown (Mức sụt giảm kỷ lục): Peak_t = Max(Price0, Price1, ..., Price_t) -> DD_t = ((Price_t - Peak_t) / (Peak_t)) * 100 -> Min(DD_0, DD_1, ..., DD_t) [luôn thu về số âm hoặc bằng 0]
### Dữ liệu lý tưởng:
```json
        {
            "coin": "bitcoin",
            "stats": {                  // (Tùy chọn) Để hiển thị thông tin tóm tắt
                "mean": 0.2,
                "std_dev": 3.5,
                "max_drawdown": -15.5
            },
            "daily_returns": [ 
                // Mảng chứa % tăng/giảm của tất cả các ngày trong bộ lọc
                2.5, -1.2, 0.5, 5.8, -0.1, 0.0, 1.2, -3.4, ... 
            ]
        }
```
## Chi tiết sơ đồ:
- Các cột (Bins): Mỗi cột đại diện cho một khoảng % lợi nhuận (Ví dụ: Cột từ 0% đến 1%).
- Chiều cao cột: Thể hiện có bao nhiêu ngày trong quá khứ giá rơi vào khoảng đó.
- Đường cong (Optional): Có thể vẽ thêm đường phân phối chuẩn (Bell Curve) đè lên để so sánh. (vẽ dựa vào dữ liệu của stats)
### Chi tiết sơ đồ:
```text
-----------------------------------------------------------------------------------------
| [HEADER] : Phân tích Rủi ro & Biến động (Risk Distribution Analysis)                  |
-----------------------------------------------------------------------------------------
| [TOOLBAR - Bộ lọc]                                                                    |
| Thời gian: [1D] [1W] [1M]           |     Tùy chọn: [x] Hiện đường cong chuẩn (Normal)|
-----------------------------------------------------------------------------------------
| [SUMMARY - Thẻ chỉ số rủi ro]                                                         |
| 🛡️ Độ ổn định: Thấp/Trung bình/Cao  |  ⚡ Biến động lớn nhất 1 ngày: -15.5%          |
-----------------------------------------------------------------------------------------
|                                                                                       |
| [MAIN CHART AREA - Plotly Div]                                                        |
|                                                                                       |
|      ^ (Số ngày xuất hiện - Trục Y)                                                   |
|      |                                                                                |
|   30 |                [VÙNG ỔN ĐỊNH]                                                  |
|      |                (Biến động nhẹ)                                                 |
|   20 |                      __                                                        |
|      |                     |  |                                                       |
|   15 |                  _  |  |  _                                                    |
|      |                 | | |  | | |                                                   |
|   10 |        [RỦI RO] | | |  | | | [HƯNG PHẤN]                                       |
|      |           __    | | |  | | |    __                                             |
|    5 |  __      |  |   | | |  | | |   |  |      __                                    |
|      | |  |     |  |   | | |  | | |   |  |     |  |                                   |
|    0 |-|--|-----|--|---|-|-|--|-|-|---|--|-----|--|------------------------------->   |
|      -10%      -5%     -1%  0% +1%     +5%      +10%     (% Lợi nhuận Ngày - Trục X)  |
|         (Sập mạnh)                    (Tăng sốc)                                      |
|                                                                                       |
-----------------------------------------------------------------------------------------
| [LEGEND & GUIDE - Hướng dẫn đọc]                                                      |
|                                                                                       |
|  📊 Cột cao ở giữa (Quanh số 0): Đa số các ngày giá chỉ đi ngang hoặc biến động nhẹ.  |
|  ⚠️ Cột xuất hiện ở xa hai bên (-10% hoặc +10%): Những ngày biến động cực đoan.       |
|     => Nếu đuôi bên trái dài: Coin này có lịch sử hay bị "sập hầm" (Crash).           |
-----------------------------------------------------------------------------------------
```
_________________________________________________________________________________________________________________

## SeasonalLineDiagram:
### Tên biểu đồ: Seasonal Cycle Chart (DPO) (Biểu đồ Chu kỳ Mùa vụ DPO).
### Mục đích: 
- Tách bỏ xu hướng dài hạn (Trend) để lộ ra các chu kỳ dao động ngắn hạn
- Xác định xem giá hiện tại đang ở Đỉnh sóng (Quá cao so với mức trung bình) hay Đáy sóng (Quá thấp so với mức trung bình) của chu kỳ đó
### Ý nghĩa: 
- Đường nằm trên vạch 0 (Dương): Giá đang ở pha Tăng của chu kỳ ngắn hạn
- Đường nằm dưới vạch 0 (Âm): Giá đang ở pha Giảm của chu kỳ ngắn hạn
- Đỉnh nhọn/Đáy nhọn: Là các điểm đảo chiều tiềm năng
- Cắt qua vạch 0: Tín hiệu xác nhận chu kỳ vừa thay đổi (từ Tăng sang Giảm hoặc ngược lại)
### Bộ lọc: coin, thời gian (1D, 1W, 1M) - tương ứng với (DPO24 - lấy 24h trước, DPO7 - lấy 7 ngày trước, DP30 - lấy 30 ngày trước - thực tế dùng DPO21)
### Thể hiện: 
- Loại biểu đồ: Line Chart.
- Trục X: Thời gian (Giờ/ Ngày/ Tháng). Trục Y: Giá trị chênh lệch (Price Deviation).
- Giá trị này dao động quanh số 0. Đơn vị là tiền tệ ($).
- Đường tham chiếu: Một đường kẻ ngang đứt đoạn tại mốc 0 (Zero Line).
### Dữ liệu nhận:
- Tên coin.
- Mảng dữ liệu Time-series chứa giá trị DPO đã tính toán.
### Công thức tính toán : (Ví dụ N = 7 cho tuần).
- Shift = INT(7/2) + 1 = 3 + 1 = 4
- Shifted SMA (SMA Trễ): Lùi đường SMA về quá khứ một khoảng thời gian Shift: Ngày hiện tại - 4 ngày trước.
- DPO: DPO = Giá đóng cửa - Shifted SMA
### Dữ liệu lý tưởng:
```json
		{
  			"coin": "bitcoin",
  			"indicator_config": "DPO_30", 
  			"data": [
    				{ "date": "2023-11-20", "value": -1500.5 }, // Đang ở dưới mức TB $1500
    				{ "date": "2023-11-21", "value": -800.0 },  // Đang hồi phục dần
    				{ "date": "2023-11-22", "value": 100.2 },   // Cắt lên trên 0 (Tín hiệu Tăng)
    				{ "date": "2023-11-23", "value": 1200.5 }   // Đang ở đỉnh sóng ngắn hạn
    				// ...
  			]
		}
```
### Chi tiết sơ đồ: 
- 1 đường cong (Line) uốn lượn liên tục biểu thị giá trị DPO theo thời gian.
- 1 đường kẻ ngang (Reference Line) nét đứt hoặc mờ tại vị trí trục 0 (Zero Line) để làm mốc so sánh.
- Màu sắc đường DPO: Có thể đổi màu tùy theo giá trị (ví dụ: Xanh khi > 0, Đỏ khi < 0) hoặc giữ 1 màu đơn sắc (ví dụ: Tím/Xanh dương) và tô màu nền mờ (Area fill) bên dưới đường cong về phía trục 0 để làm nổi bật độ lớn của sóng.
- Tương tác: Khi trỏ chuột vào một điểm trên đường, hiển thị Tooltip gồm: Ngày tháng, Giá trị DPO ($), và Trạng thái (VD: "Đang cao hơn mức TB $500").
### Bố cục giao diện:
```text
-----------------------------------------------------------------------------------------
| [HEADER] : 🌊 Chu kỳ Sóng & Nhịp điệu (Seasonal / DPO Analysis)                       |
-----------------------------------------------------------------------------------------
| [TOOLBAR] Thời gian: [1D] [1W] [1M]      |      Chu kỳ: [30 Ngày (Tháng)]             |
-----------------------------------------------------------------------------------------
|                                                                                       |
|   (Chênh lệch $)                                                                      |
|      ^                                                                                |
|      |             (Đỉnh sóng - Quá mua)                                              |
| +2000|                  /\                                                            |
|      |                 /  \           (Cắt xuống: Tín hiệu Bán ngắn hạn)              |
|      |                /    \          |                                               |
|     0|---------------/------\---------X------------------------------------------->   |
|      |       (Cắt lên)       \      /   \                                             |
|      |             /          \    /     \                                            |
| -2000|            /            \  /       \                                           |
|      |           /              \/         \                                          |
|      |        (Đáy sóng)                   (Đáy sóng tiếp theo)                       |
|                                                                                       |
-----------------------------------------------------------------------------------------
| [INSIGHT CARD]                                                                        |
| 📢 Trạng thái: DPO đang ở vùng ÂM (-1500). Giá đang thấp hơn mức trung bình chu kỳ.   |
| 👉 Gợi ý: Canh mua khi đường DPO bắt đầu ngóc đầu đi lên và cắt qua vạch 0.           |
-----------------------------------------------------------------------------------------
```
_________________________________________________________________________________________________________________

## CorrelationHeatmap:
### Tên biểu đồ: Cross-Asset Correlation Matrix (Ma trận Tương quan Đa tài sản).
### Mục đích: 
- Tìm mối liên hệ giữa các đồng coin (hoặc các chỉ số).
- Giúp nhà đầu tư cơ cấu danh mục (Ví dụ: Không nên mua cả BTC và ETH nếu chúng giống hệt nhau, hãy mua 1 con coin nghịch đảo để giảm rủi ro).
### Ý nghĩa: 
- Cung cấp chiến lược đầu tư đa dạng thay vì "đặt toàn bộ trứng vào 1 giỏ"
### Bộ lọc: Thời gian (Tính tương quan trong 1W, 1M).
### Thể hiện: 
        + Trục X và Trục Y: Danh sách các đồng coin (BTC, ETH, BNB, SOL...).
        + Ô giao nhau: Hiển thị hệ số tương quan (Correlation Coefficient).
### Dữ liệu nhận:
- Tên coin
- Một ma trận 2 chiều chứa các hệ số.
### Công thức tính toán:
- Danh sách giá đóng cửa của 4 coin trong N ngày (giả sử A, B, C, D)
- Trung bình giá của các coin: meanA, meanB, meanC, meanD
- r(Hệ số Tương quan Pearson): [Tổ hợp châp 2 của N]
	+ Tính r(A, B), tính r(A, C), tính r(A, D)
	+ Tính r(B, C), tính r(B, D)
	+ Tính r(C, D)
	+ Tổng quát r: r(A, B) = SUM((A_n - meanA) * (B_n - meanB)) / SQRT(SUM((A_n - meanA)^2) * SUM((B_n - meanB)^2))
### Dữ liệu lý tưởng: 
```json
        {
            "labels": ["BTC", "ETH", "BNB", "USDT"], // Nhãn trục X, Y
            "z_values": [
                [1.0,  0.85, 0.70, -0.2], // Dòng 1: BTC so với 4 con
                [0.85, 1.0,  0.65, -0.1], // Dòng 2: ETH so với 4 con
                [0.70, 0.65, 1.0,  -0.05], // Dòng 3: BNB so với 4 con
                [-0.2, -0.1, -0.05, 1.0]  // Dòng 4: USDT so với 4 con
            ]
        }
```
### Chi tiết sơ đồ: 
- Một bảng lưới (Grid/Matrix) kích thước NxN (với N là số lượng coin được chọn).
- Mỗi ô vuông (Cell) được tô màu dựa trên giá trị hệ số tương quan (r):
	+ Dải màu nóng (Vàng -> Đỏ đậm): Đại diện cho tương quan dương (0 đến +1). Đỏ càng đậm, tương quan càng chặt chẽ.
	+ Dải màu lạnh (Xanh nhạt -> Xanh đậm): Đại diện cho tương quan âm (0 đến -1).
	+ Màu trung tính (Trắng/Xám nhạt): Đại diện cho không tương quan (gần 0).
- Bên cạnh biểu đồ có một thanh màu (Color Bar) đóng vai trò chú giải, hiển thị dải màu từ -1 đến +1.
- Tương tác: Khi rê chuột vào một ô, hiển thị Tooltip chi tiết: "Tương quan giữa [Coin A] và [Coin B]: r = [Giá trị]".
### Chi tiết sơ đồ:
```text
-----------------------------------------------------------------------------------------
| [TITLE] 🌡️ Bản đồ nhiệt thị trường (Market Correlation)                              |
-----------------------------------------------------------------------------------------
| [TOOLBAR] Thời gian: [1W] [1M]                                                        |
-----------------------------------------------------------------------------------------
|           |   BTC   |   ETH   |   BNB   |   SOL   |  USDT   |                         |
|-----------|---------|---------|---------|---------|---------|      [COLOR BAR]        |
|   BTC     | [RED] 1 |  0.92   |  0.85   |  0.78   |  -0.4   |      Based on r value   |
|-----------|---------|---------|---------|---------|---------|      (RED)  +1.0        |
|   ETH     |  0.92   | [RED] 1 |  0.80   |  0.75   |  -0.3   |        |    Cùng chiều  |
|-----------|---------|---------|---------|---------|---------|        |                |
|   BNB     |  0.85   |  0.80   | [RED] 1 |  0.60   |  -0.2   |      (WHT)   0.0        |
|-----------|---------|---------|---------|---------|---------|        |    Ko lquan    |
|   SOL     |  0.78   |  0.75   |  0.60   | [RED] 1 |  -0.1   |        |                |
|-----------|---------|---------|---------|---------|---------|      (BLU)  -1.0        |
|   USDT    |  -0.4   |  -0.3   |  -0.2   |  -0.1   | [RED] 1 |             Ngược chiều |
-----------------------------------------------------------------------------------------
| [Note]: Dữ liệu được tính toán dựa trên giá đóng cửa trong 30 ngày gần nhất.          |
-----------------------------------------------------------------------------------------
```
_________________________________________________________________________________________________________________

## SignalClassification:
### Chi tiết sơ đồ: 
- Tổng hợp tất cả phân tích ở trên để đưa ra 1 lời khuyên duy nhất cho người dùng.
- Trả lời câu hỏi: "Tóm lại mai là Tăng (Up), Giảm (Down) hay Đi ngang (Sideway)?"
### Ý nghĩa: 
- Tư vấn đưa ra quyết định nên làm gì tiếp theo
    + MUA MẠNH (Strong Buy): Khi giá tăng + Volume tăng + DPO cắt lên.
    + BÁN MẠNH (Strong Sell): Khi giá giảm + Volume tăng + DPO cắt xuống.
    + TRUNG LẬP (Neutral): Khi các chỉ số mâu thuẫn nhau.
### Bộ lọc: Thời gian (1D, 1W, 1M).
### Thể hiện: 
- Dạng Thẻ (Card).
- Màu sắc: Xanh (Tăng) - Đỏ (Giảm) - Vàng (Đi ngang).
### Dữ liệu nhận:
- Label phân loại: "UP", "DOWN", "SIDEWAY".
- Confidence Score: Độ tin cậy (Ví dụ: 80%).
### Công thức tính toán:
- Hệ thống chấm điểm đa yếu tố (Multi-Factor Scoring): 
	+ Điểm Trend = +1 nếu Giá > MA20, ngược lại -1. [Chọn MA20 để đồng bộ Middle Band đã tính trước đó thay vì MA50 cho chu kì dài hơn như tháng và năm]
	+ Điểm Momentum = +1 nếu RSI < 30 (Quá bán), -1 nếu RSI > 70 (Quá mua).
	+ Điểm Cycle = +1 nếu DPO cắt lên 0, -1 nếu DPO cắt xuống 0.
- Tổng điểm (Total Score): Cộng tất cả các điểm thành phần lại.
- Phân loại (Classification):
	+ Điểm lớn hơn 0: BUY.
	+ Điểm bé hơn 0: SELL.
	+ Điểm bằng 0: NEUTRAL.
- Độ tin cậy (Confidence): (ABS(Tổng điểm) / Điểm tối đa) * 100% [Điểm tối đa là số lượng các yếu tố]
### Dữ liệu lý tưởng:
```json
        {
            "prediction_date": "2023-11-28",
            "signal": "STRONG_BUY",  // Kết quả phân loại
            "score": 80,             // Điểm số (0-100)
            "factors": ["RSI < 30", "Volume Spike", "Uptrend"] // Lý do
        }
```
### $Chi tiết hiển thị:
- Thiết kế dạng Thẻ thông tin (Info Card) hoặc Widget nổi bật.
- Phần tử chính: Nhãn Tín hiệu (Signal Label) được hiển thị to, rõ ràng với màu sắc định danh (Xanh lá = Mua, Đỏ = Bán, Xám/Vàng = Trung lập).
- Thanh độ tin cậy (Confidence Bar): Một thanh tiến trình (Progress bar) hoặc đồng hồ (Gauge) thể hiện điểm số (Score) từ 0% đến 100%.
- Danh sách lý do (Factor List): Liệt kê ngắn gọn các yếu tố dẫn đến kết luận (VD: "✅ RSI < 30", "✅ Uptrend", "❌ DPO Negative").
- Icon minh họa: Sử dụng icon mũi tên lên/xuống hoặc biểu tượng cảm xúc (🚀, 🐻) để tăng tính trực quan.
### Chi tiết sơ đồ:
```text
------------------------------------------------------
|  🔮 TÍN HIỆU NGÀY MAI:  [ MUA MẠNH ] (Xanh lá)      |
|-----------------------------------------------------|
|  Độ tin cậy: ████████░░ 80%                         |
|  Lý do: RSI quá bán, DPO vừa cắt lên.               |
-------------------------------------------------------
```
