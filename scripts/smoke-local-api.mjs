import { spawn } from "node:child_process";

const explicitUrl = Boolean(process.env.SMOKE_URL);
let baseUrl = (process.env.SMOKE_URL || "http://127.0.0.1:4176").replace(/\/$/, "");
let apiUrl = `${baseUrl}/api/state`;
let healthUrl = `${baseUrl}/api/health`;
let spawnedServer = null;

async function main() {
  await ensureServer();
  const original = await readState();

  try {
    await assertPage();
    await assertHealth();
    await assertStorageHeader();
    await assertPostRoundTrip();
    await assertBadJson();
    await assertBadShape();
    console.log(`Smoke passed: ${baseUrl}`);
  } finally {
    await writeState(original);
    stopServer();
  }
}

async function ensureServer() {
  if (await apiReady(baseUrl)) return;
  if (explicitUrl) {
    throw new Error(`Smoke target is not a compatible stock-journal dev server: ${baseUrl}`);
  }

  const candidates = Array.from({ length: 11 }, (_, index) => `http://127.0.0.1:${4176 + index}`);
  for (const candidate of candidates) {
    if (await apiReady(candidate)) {
      setBaseUrl(candidate);
      return;
    }

    if (await canReach(candidate)) continue;

    setBaseUrl(candidate);
    await startServerForCurrentUrl();
    return;
  }

  throw new Error("No compatible dev server found and no free port in 4176-4186");
}

async function startServerForCurrentUrl() {
  const url = new URL(baseUrl);
  spawnedServer = spawn(process.execPath, ["dev-server.mjs"], {
    env: {
      ...process.env,
      HOST: url.hostname,
      PORT: url.port || "80"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stderr = "";
  spawnedServer.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await apiReady(baseUrl)) return;
    if (spawnedServer.exitCode !== null) {
      throw new Error(`Unable to start dev server: ${stderr.trim() || `exit ${spawnedServer.exitCode}`}`);
    }
    await delay(150);
  }

  throw new Error(`Dev server did not become ready: ${baseUrl}`);
}

async function apiReady(url) {
  try {
    const stateResponse = await fetch(`${url}/api/state`);
    const healthResponse = await fetch(`${url}/api/health`);
    return (
      stateResponse.ok &&
      stateResponse.headers.get("X-Stock-Journal-Storage") === "local-api" &&
      healthResponse.ok &&
      healthResponse.headers.get("X-Stock-Journal-Storage") === "local-api"
    );
  } catch {
    return false;
  }
}

async function canReach(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function setBaseUrl(url) {
  baseUrl = url.replace(/\/$/, "");
  apiUrl = `${baseUrl}/api/state`;
  healthUrl = `${baseUrl}/api/health`;
}

function stopServer() {
  if (spawnedServer && spawnedServer.exitCode === null) {
    spawnedServer.kill("SIGTERM");
  }
}

async function assertPage() {
  const response = await fetch(baseUrl);
  assert(response.ok, `Page failed: ${response.status}`);
  const html = await response.text();
  assert(html.includes("A 股研究手账"), "Page HTML missing app title");
  ["overview", "market", "research", "decision", "plan", "checkin"].forEach((id) => {
    assert(html.includes(`id="${id}"`), `Page HTML missing sheet: ${id}`);
  });
  ["exportMarkdownButton", "saveStatus", "particleCanvas"].forEach((id) => {
    assert(html.includes(`id="${id}"`), `Page HTML missing control: ${id}`);
  });
}

async function assertHealth() {
  const response = await fetch(healthUrl);
  assert(response.ok, `GET /api/health failed: ${response.status}`);
  assert(
    response.headers.get("X-Stock-Journal-Storage") === "local-api",
    "GET /api/health missing local-api storage header"
  );
  const health = await response.json();
  assert(health.ok === true && health.storage === "local-api", "GET /api/health returned unexpected body");
}

async function assertStorageHeader() {
  const response = await fetch(apiUrl);
  assert(response.ok, `GET /api/state failed: ${response.status}`);
  assert(
    response.headers.get("X-Stock-Journal-Storage") === "local-api",
    "GET /api/state missing local-api storage header"
  );
}

async function assertPostRoundTrip() {
  const payload = {
    smoke: "ok",
    schemaVersion: 2,
    updatedAt: new Date().toISOString()
  };
  const post = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert(post.ok, `POST /api/state failed: ${post.status}`);

  const next = await readState();
  assert(next.smoke === "ok", "POST /api/state did not persist payload");
  assert(next.schemaVersion === 2, "POST /api/state did not preserve schema version");
}

async function assertBadJson() {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad-json"
  });
  assert(response.status === 400, `Bad JSON should return 400, got ${response.status}`);
}

async function assertBadShape() {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(["not", "a", "state"])
  });
  assert(response.status === 400, `Array state should return 400, got ${response.status}`);
}

async function readState() {
  const response = await fetch(apiUrl);
  assert(response.ok, `GET /api/state failed: ${response.status}`);
  return response.json();
}

async function writeState(state) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state || {})
  });
  assert(response.ok, `Failed to restore state: ${response.status}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
