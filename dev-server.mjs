import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number.parseInt(process.env.PORT || "4176", 10);
const host = process.env.HOST || "127.0.0.1";
const stateFile = join(root, ".local-state.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  return join(root, safePath === "/" ? "index.html" : safePath);
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || "/", `http://${host}:${port}`).pathname;
    if (pathname === "/api/health") {
      handleHealthApi(request, response);
      return;
    }

    if (pathname === "/api/state") {
      await handleStateApi(request, response);
      return;
    }

    let filePath = resolvePath(request.url || "/");
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    const body = await readFile(filePath);
    const type = mimeTypes[extname(filePath)] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

function handleHealthApi(request, response) {
  if (!["GET", "OPTIONS"].includes(request.method)) {
    sendJson(response, { error: "Method not allowed" }, 405);
    return;
  }

  sendJson(response, {
    ok: true,
    storage: "local-api",
    stateFile: ".local-state.json"
  });
}

async function handleStateApi(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, { ok: true });
    return;
  }

  if (request.method === "GET") {
    try {
      const body = await readFile(stateFile, "utf8");
      sendJson(response, JSON.parse(body));
    } catch {
      sendJson(response, {});
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const body = await readRequestBody(request);
      const data = JSON.parse(body || "{}");
      if (!isPlainObject(data)) {
        sendJson(response, { error: "State must be a JSON object" }, 400);
        return;
      }
      await writeFile(stateFile, JSON.stringify(data, null, 2));
      sendJson(response, { ok: true });
    } catch {
      sendJson(response, { error: "Invalid JSON body" }, 400);
    }
    return;
  }

  sendJson(response, { error: "Method not allowed" }, 405);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(response, body, status = 200) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Allow": "GET, POST, OPTIONS",
    "X-Stock-Journal-Storage": "local-api"
  });
  response.end(JSON.stringify(body));
}

server.listen(port, host, () => {
  console.log(`Stock journal preview: http://${host}:${port}`);
});
