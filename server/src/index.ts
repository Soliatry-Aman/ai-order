/**
 * Express backend — AI Order Assistant
 *
 * Security: API keys live ONLY here in .env.
 * The frontend (React) never sees them — it only talks to /api/chat on this server.
 *
 * Architecture:
 *   React → POST /api/chat → [Provider] → AI Model → SSE stream back to React
 *   React → GET  /api/db/* → Express reads db.json directly (no json-server needed)
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createProvider } from "./providers/index";
import type { ClientMessage } from "./providers/types";

dotenv.config();

// ── Load db.json once on startup (refresh on each request for cancel_order writes) ──
const DB_PATH = path.resolve(__dirname, "../db.json");

type DbData = {
  orders: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  policies: Array<Record<string, unknown>>;
};

function readDb(): DbData {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DbData;
}

function writeDb(data: DbData): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ── Validate env early so you get a clear error on startup ──────────────────
const AI_PROVIDER = (process.env.AI_PROVIDER ?? "groq").toLowerCase();
console.log(`\n🚀  Starting AI Order Assistant backend`);
console.log(`   Primary provider: ${AI_PROVIDER}`);
console.log(`   Mode: Auto-fallback (tries next provider if primary fails)`);
if (process.env.AI_MODEL) {
  console.log(`   Model override: ${process.env.AI_MODEL}`);
}

let provider: ReturnType<typeof createProvider>;
try {
  provider = createProvider();
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`❌  Provider init failed: ${msg}`);
  console.error(`   Check your .env file and make sure the correct API key is set.\n`);
  process.exit(1);
}

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", provider: provider.name });
});

// ── DB routes (replaces json-server, reads db.json directly) ─────────────────

// GET /api/db/orders/:id  — matches by order ID or customer name
app.get("/api/db/orders/:id", (req, res) => {
  const db = readDb();
  const query = req.params.id.trim().toLowerCase();

  // 1️⃣ Try exact order ID match first
  let order = db.orders.find((o) => String(o.id).toLowerCase() === query);

  // 2️⃣ Fallback: search by customer name (case-insensitive, partial match)
  if (!order) {
    order = db.orders.find((o) =>
      typeof o.customer === "string" &&
      o.customer.toLowerCase().includes(query)
    );
  }

  if (!order) {
    res.status(404).json({ error: `No order found matching "${req.params.id}".` });
    return;
  }
  res.json(order);
});

// GET /api/db/inventory?sku=...
app.get("/api/db/inventory", (req, res) => {
  const db = readDb();
  const sku = req.query.sku as string | undefined;
  if (sku) {
    const results = db.inventory.filter((i) => i.sku === sku);
    res.json(results);
  } else {
    res.json(db.inventory);
  }
});

// GET /api/db/policies?topic=...
app.get("/api/db/policies", (req, res) => {
  const db = readDb();
  const topic = req.query.topic as string | undefined;
  if (topic) {
    const results = db.policies.filter((p) => p.topic === topic);
    res.json(results);
  } else {
    res.json(db.policies);
  }
});

// PATCH /api/db/orders/:id  (used by cancel_order)
app.patch("/api/db/orders/:id", (req, res) => {
  const db = readDb();
  const idx = db.orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  db.orders[idx] = { ...db.orders[idx], ...req.body };
  writeDb(db);
  res.json(db.orders[idx]);
});

// ── Chat endpoint (SSE) ──────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const messages: ClientMessage[] = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  // Set SSE headers before writing anything
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering if deployed

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    for await (const event of provider.stream(messages)) {
      sendEvent(event);
    }
    res.write("data: [DONE]\n\n");
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : "Unknown provider error";
    const status = (err as any)?.status ?? (err as any)?.code;
    console.error("Provider stream error:", err);

    // Build a clean, human-readable message (strip raw JSON noise)
    let friendlyMsg: string;
    if (status === 429) {
      friendlyMsg = "⏳ Rate limit reached on the AI provider. Please wait a few seconds and try again.";
    } else if (status === 404) {
      friendlyMsg = "❌ The selected AI model is not available for this API key. Check AI_PROVIDER in server/.env.";
    } else if (status === 401 || status === 403) {
      friendlyMsg = "🔑 Invalid API key for all configured providers. Double-check your API keys in server/.env.";
    } else {
      // Truncate and clean raw message
      friendlyMsg = raw.replace(/\{[\s\S]{0,500}\}/g, '').trim().slice(0, 300) || "An unexpected error occurred.";
    }

    try {
      sendEvent({ type: "error", message: friendlyMsg });
    } catch {
      // Response might already be closed
    }
  } finally {
    res.end();
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`✅  Server ready on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Chat:   POST http://localhost:${PORT}/api/chat\n`);

  // ── Keep-alive self-ping (prevents Render free tier cold starts) ──────────
  // Render spins down services after 15 min of inactivity.
  // We ping our own /api/health every 14 min to stay warm.
  if (process.env.NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
    const healthUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;

    setInterval(async () => {
      try {
        const res = await fetch(healthUrl);
        const data = await res.json() as { status: string };
        console.log(`🏓  Keep-alive ping → ${healthUrl} — ${data.status}`);
      } catch (err) {
        console.warn(`⚠️  Keep-alive ping failed:`, err instanceof Error ? err.message : err);
      }
    }, PING_INTERVAL_MS);

    console.log(`🏓  Keep-alive enabled → pinging ${healthUrl} every 14 min`);
  }
});
