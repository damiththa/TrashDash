# 🗑️ TrashDash (TRMNL Plugin)

A custom serverless plugin for the **TRMNL e-ink display** that reminds you to take out trash and recycling in **Leominster, MA**.

It automatically handles the 6 city-observed holidays, shifting pickup to Saturday and the reminder to Friday when applicable, and displays rotating messages with high-contrast UI optimized for e-ink.

---

## 🚀 Deployment Guide

### Option A: Cloudflare Dashboard (Easiest)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**.
2. Click **Create Application** -> **Create Worker**.
3. Name it `trash-dash` and click **Deploy**.
4. Click **Edit Code**.
5. Copy the contents of `src/index.js` and `src/trash_logic.js` (or combine them) and click **Deploy**.

### Option B: Deploy via Wrangler CLI
```bash
npm install
npm run deploy
```

---

## 📺 Connecting to TRMNL

1. Open your [TRMNL Plugins Dashboard](https://trmnl.com/plugins).
2. Create a **New Private Plugin**.
3. Select **Serverless / Webhook** mode.
4. Enter your Cloudflare Worker URL (`https://trash-dash.<your-subdomain>.workers.dev`).
5. Set your desired refresh rate (e.g., every 30-60 minutes).
