# analysis-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Cài đặt các phụ thuộc cần thiết cho psycopg2 (trên hệ thống Linux)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements.txt và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn
COPY analysis.py .

EXPOSE 5002

CMD ["sh", "-c", "while true; do python analysis.py; sleep 300; done"]