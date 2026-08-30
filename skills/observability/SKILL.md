---
name: observability-metrics
description: Prometheus metrics, Grafana dashboards, health endpoints, and structured logging
---

# Observability & Monitoring Skill

## 1. Endpoints & Probes
- **`/health`**: Lightweight summary probe.
- **`/health/live`**: Fast liveness probe returning `{ status: 'ok' }`.
- **`/health/ready`**: Deep readiness probe verifying PostgreSQL connection, Redis ping, and S3 bucket availability.
- **`/metrics`**: Prometheus text-format scrape endpoint.

## 2. Metrics Taxonomy
- `http_requests_total`: Counter by method, route, status code.
- `http_request_duration_seconds`: Histogram of latency across API routes.
- `http_request_errors_total`: Counter for 4xx and 5xx responses.

## 3. Structured Logging
- Uses Pino logger with automatic request ID correlation (`x-request-id`).
- In development, logs formatted for human readability; in production, logs emitted as newline-delimited JSON.
