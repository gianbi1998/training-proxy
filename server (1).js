// trAIning — Intervals.icu API Proxy
// Leitet Requests vom Browser an Intervals.icu weiter (umgeht CORS)
// Usage: node server.js

const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3001;
const ATHLETE_ID = "i583394";
const API_KEY = "1uqumh55rfzexu016353oumvd";
const BASE = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}`;
const AUTH = "Basic " + Buffer.from(`API_KEY:${API_KEY}`).toString("base64");

const server = http.createServer((req, res) => {
  // CORS headers — erlaubt Requests von überall (Artifact, localhost, etc.)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only allow GET requests starting with /api/
  if (!req.url.startsWith("/api/")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      message: "trAIning Intervals.icu Proxy läuft",
      athlete: ATHLETE_ID,
      endpoints: [
        "/api/activities?oldest=2026-05-01&newest=2026-06-01",
        "/api/wellness?oldest=2026-05-01&newest=2026-06-01",
      ],
    }));
    return;
  }

  // Strip /api/ prefix, forward to Intervals.icu
  const icuPath = req.url.replace(/^\/api\//, "");
  const icuUrl = `${BASE}/${icuPath}`;

  console.log(`→ ${icuUrl}`);

  const icuReq = https.get(icuUrl, {
    headers: {
      "Authorization": AUTH,
      "Accept": "application/json",
    },
  }, (icuRes) => {
    let body = "";
    icuRes.on("data", (chunk) => body += chunk);
    icuRes.on("end", () => {
      res.writeHead(icuRes.statusCode, { "Content-Type": "application/json" });
      res.end(body);
      console.log(`  ← ${icuRes.statusCode} (${body.length} bytes)`);
    });
  });

  icuReq.on("error", (err) => {
    console.error("  ✗ Error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  });
});

server.listen(PORT, () => {
  console.log(`\n🟢 trAIning Proxy läuft auf Port ${PORT}`);
  console.log(`   Athlete: ${ATHLETE_ID}\n`);
});
