import { fetchMarketSnapshot } from "../../lib/market-data.mjs";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") return json({ ok: true });
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    return json(await fetchMarketSnapshot());
  } catch {
    return json({ error: "Failed to fetch market data" }, 502);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Allow": "GET, OPTIONS",
      "X-Stock-Journal-Market": "eastmoney"
    }
  });
}
