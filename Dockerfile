# syntax=docker/dockerfile:1

# ---------- 1. Build the React frontend ----------
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2. FastAPI app that also serves the built frontend ----------
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    STATIC_DIR=/app/static

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
COPY --from=frontend /frontend/dist ./static

# Strip Windows line endings in case the repo was checked out with CRLF.
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh \
    && useradd --create-home --uid 1000 app
USER app

EXPOSE 8000
CMD ["./start.sh"]
