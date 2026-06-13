export async function onRequest({ request, env }) {
  if (!["GET", "OPTIONS"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405, env);
  }

  return json({
    ok: true,
    storage: "d1",
    dbBound: Boolean(env?.DB)
  }, 200, env);
}

function json(body, status = 200, env = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Allow": "GET, OPTIONS",
      "X-Stock-Journal-Storage": env?.DB ? "d1" : "missing-db"
    }
  });
}
