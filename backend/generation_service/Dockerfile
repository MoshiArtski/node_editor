FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8002
CMD ["sanic", "src.main.app", "--host=0.0.0.0", "--port=8002", "--reload"]
