const STATE_ID = "main";

export async function onRequest({ request, env }) {
  if (request.method === "GET") return handleGet(env);
  if (request.method === "POST") return handlePost(request, env);
  if (request.method === "OPTIONS") return json({ ok: true });
  return json({ error: "Method not allowed" }, 405);
}

async function handleGet(env) {
  if (!hasDatabase(env)) {
    return json({ error: "D1 binding DB is missing" }, 503);
  }

  try {
    const row = await env.DB.prepare("SELECT data FROM app_state WHERE id = ?")
      .bind(STATE_ID)
      .first();

    if (!row?.data) return json({});
    return json(JSON.parse(row.data));
  } catch (error) {
    return json({ error: "Failed to read state" }, 500);
  }
}

async function handlePost(request, env) {
  if (!hasDatabase(env)) {
    return json({ error: "D1 binding DB is missing" }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!isPlainObject(data)) {
    return json({ error: "State must be a JSON object" }, 400);
  }

  try {
    await env.DB.prepare(`
      INSERT INTO app_state (id, data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `)
      .bind(STATE_ID, JSON.stringify(data))
      .run();
  } catch {
    return json({ error: "Failed to save state" }, 500);
  }

  return json({ ok: true });
}

function hasDatabase(env) {
  return Boolean(env?.DB);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Allow": "GET, POST, OPTIONS",
      "X-Stock-Journal-Storage": "d1"
    }
  });
}
