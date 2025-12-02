FROM python:3.11-slim
WORKDIR /app

# Giúp log in ra terminal ngay lập tức (rất quan trọng khi demo để thấy tiến trình training)
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
# Đảm bảo requirements.txt đã có: pandas, scikit-learn, schedule, psycopg2-binary
RUN pip install -r requirements.txt

COPY . .

# Expose port (tùy chọn, để document rõ ràng)
EXPOSE 5003

CMD ["python", "prediction.py"]