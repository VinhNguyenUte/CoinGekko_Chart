class SignalCard {
    static render(data) {
        // Data structure: { signal: "STRONG BUY", score: 80, factors: [...] }
        if (!data) {
            console.warn("SignalCard: No data available");
            return;
        }

        // 1. Tìm các phần tử DOM
        // (Giả sử bạn đang dùng cấu trúc HTML đơn giản trong file index.html bạn gửi)
        const signalCard = document.querySelector('.signal-card:first-child'); // Lấy thẻ Signal (thẻ đầu tiên)
        const valueElement = signalCard ? signalCard.querySelector('.signal-value') : null;

        if (!signalCard || !valueElement) return;

        // 2. Cập nhật Text
        valueElement.textContent = data.signal;

        // 3. Cập nhật Màu sắc (Class)
        // Xóa các class cũ đi để tránh bị trùng (ví dụ vừa có class 'buy' vừa có 'sell')
        signalCard.classList.remove('buy', 'sell', 'neutral');

        // Logic gán class mới
        const signalText = data.signal.toUpperCase();
        if (signalText.includes('BUY')) {
            signalCard.classList.add('buy');
        } else if (signalText.includes('SELL')) {
            signalCard.classList.add('sell');
        } else {
            signalCard.classList.add('neutral');
        }
    }
}