# ParaHist Web Application

**Parallel Histogram Generation Using OpenMP — Web Dashboard**

A professional React + Node.js + Express frontend/backend that visualizes and
controls the existing C++17/OpenMP histogram engine.

---

## Architecture

```
React Frontend (Vite, port 5173)
        ↓ /api/* (proxied by Vite dev server)
Node.js + Express Backend (port 5000)
        ↓ execFile() — no shell injection
C++ OpenMP Engine (build/parahist)
        ↓
dataset/train.csv  →  results/*.csv
```

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install          # first time only
npm start            # or: npm run dev  (with nodemon)
```

Backend starts at **http://localhost:5000**

### 2. Start the Frontend

```bash
cd frontend
npm install          # first time only
npm run dev
```

Frontend starts at **http://localhost:5173**

Open **http://localhost:5173** in your browser.

---

## API Endpoints

| Method | Endpoint              | Description                            |
|--------|-----------------------|----------------------------------------|
| GET    | `/api/health`         | Liveness check                         |
| GET    | `/api/system`         | CPU, platform, executable info         |
| GET    | `/api/dataset`        | MNIST dataset metadata                 |
| GET    | `/api/histogram`      | Read histogram_seq/par.csv             |
| POST   | `/api/histogram/run`  | Trigger C++ histogram (body: threads)  |
| GET    | `/api/benchmark`      | Read benchmark_summary.csv             |
| POST   | `/api/benchmark`      | Trigger C++ benchmark (body: maxThreads)|

### Example Requests

```bash
# Health check
curl http://localhost:5000/api/health

# Dataset info
curl http://localhost:5000/api/dataset

# Benchmark results
curl http://localhost:5000/api/benchmark

# Trigger histogram with 8 threads
curl -X POST http://localhost:5000/api/histogram/run \
  -H "Content-Type: application/json" \
  -d '{"threads": 8}'
```

---

## Configuration

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5000
CPP_EXECUTABLE=build/parahist
DATASET_PATH=dataset/train.csv
RESULTS_DIR=results
FRONTEND_URL=http://localhost:5173
```

> The backend auto-detects the project root relative to its own location.
> You only need to set `CPP_EXECUTABLE` if you built in a non-standard location.

---

## Pages

| Page          | URL            | Description                                  |
|---------------|----------------|----------------------------------------------|
| Dashboard     | `/`            | Overview stats, histogram preview, scaling   |
| Histogram     | `/histogram`   | Full 256-bin chart, run sequential/parallel  |
| Performance   | `/performance` | Time, speedup, efficiency charts + table     |
| About         | `/about`       | Project explanation, formulas, algorithm     |

---

## Production Build

```bash
cd frontend
npm run build   # outputs to frontend/dist/
```

Serve `frontend/dist/` with any static file server, and the backend separately.

---

## Security Notes

- The backend uses `execFile()` — no shell string construction from user input
- Thread count is validated: integer, 1–64 only
- CORS is configured to accept only the frontend origin
- No authentication needed (local/demo project)
