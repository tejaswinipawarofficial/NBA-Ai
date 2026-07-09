# NBA Accreditation Assistant — Deployment Guide (IBM Cloud Code Engine)

## Quick Start (Local)

```powershell
# 1. Install dependencies
pip install -r requirements.txt

# 2. Verify .env has your credentials (already pre-filled)
#    IBM_CLOUD_API_KEY, WATSONX_PROJECT_ID, WATSONX_URL

# 3. Place the NBA General Manual PDF
#    Copy PDF → knowledge_base\NBA_General_Manual.pdf

# 4. Run
python app.py
# Open: http://localhost:5000
```

## Environment Variables (.env)

| Variable | Value |
|----------|-------|
| `IBM_CLOUD_API_KEY` | Your IBM Cloud API key |
| `WATSONX_PROJECT_ID` | Your watsonx.ai project ID |
| `WATSONX_URL` | `https://au-syd.ml.cloud.ibm.com` (Sydney) |
| `GRANITE_MODEL_ID` | `ibm/granite-3-8b-instruct` |
| `NBA_PDF_FILENAME` | `NBA_General_Manual.pdf` |
| `RAG_TOP_K` | `5` |
| `MAX_NEW_TOKENS` | `1024` |

## Deploy to IBM Cloud Code Engine

```bash
# Login
ibmcloud login --apikey $IBM_CLOUD_API_KEY -r au-syd

# Create Code Engine project
ibmcloud ce project create --name nba-accreditation-app
ibmcloud ce project select --name nba-accreditation-app

# Create secrets
ibmcloud ce secret create --name nba-env \
  --from-literal IBM_CLOUD_API_KEY="YOUR_KEY" \
  --from-literal WATSONX_PROJECT_ID="YOUR_PROJECT_ID" \
  --from-literal WATSONX_URL="https://au-syd.ml.cloud.ibm.com" \
  --from-literal FLASK_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')" \
  --from-literal PORT="8080"

# Deploy
ibmcloud ce app create \
  --name nba-accreditation-assistant \
  --build-source . \
  --build-dockerfile Dockerfile \
  --env-from-secret nba-env \
  --port 8080 \
  --min-scale 1 \
  --memory 2G \
  --cpu 1

# Get URL
ibmcloud ce app get --name nba-accreditation-assistant --output url
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/` | Web application |
| POST | `/api/chat` | RAG chat — `{"message":"..."}` |
| GET  | `/api/status` | Health check |
| GET  | `/api/criteria` | NBA criteria definitions |
| POST | `/api/copomapping` | CO-PO matrix generator |
| POST | `/api/rebuild-index` | Re-index PDF |
| POST | `/api/clear-history` | Reset chat history |

## Troubleshooting

| Error | Fix |
|-------|-----|
| `IBM_CLOUD_API_KEY must be set` | Check `.env` has the key with no leading spaces |
| PDF not found at startup | Place PDF in `knowledge_base/` folder |
| `401 Unauthorized` from watsonx | API key expired — regenerate at cloud.ibm.com |
| Slow first startup | One-time FAISS indexing; subsequent starts reuse cache |
| `tf-keras` error | Run `pip install tf-keras` |
