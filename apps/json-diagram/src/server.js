"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { listPresets, validatePromptInput } = require("@repo/shared");
const { runPipeline } = require("./index");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload, null, 2));
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { ok: false, error: "Not found" });
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/presets") {
    sendJson(response, 200, {
      ok: true,
      presets: listPresets(),
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/pipeline") {
    try {
      const payload = await parseRequestBody(request);
      const preview = validatePromptInput(payload);
      const result = runPipeline(payload);

      sendJson(response, result.ok ? 200 : 422, {
        ...result,
        preview,
      });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error.message,
      });
    }
    return;
  }

  sendJson(response, 404, {
    ok: false,
    error: "Unknown API route",
  });
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(request, response, pathname);
      return;
    }

    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      sendJson(response, 403, { ok: false, error: "Forbidden" });
      return;
    }

    sendFile(response, filePath);
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`JSON Diagram UI running at http://${HOST}:${PORT}`);
  });
}

module.exports = {
  createServer,
};
