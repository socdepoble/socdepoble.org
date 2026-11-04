import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";

const PORT = Number(process.env.SDP_NODE_PORT || 3350);
const BASE_DIR = process.env.SDP_NODE_BASE_DIR || path.join(os.homedir(), "socdepoble-node0");
const PUBLIC_DIR = path.join(BASE_DIR, "public");
const DATA_DIR = path.join(BASE_DIR, "dades");
const MEDIA_DIR = path.join(BASE_DIR, "media");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

const KEYS_FILE = path.join(DATA_DIR, "node0_ed25519.json");
const NODE0_NOM_POBLE = "Node 0 · La Torre (Mac Mini M4, 24GB)";
const NODE0_POBLE_ID = "la-torre-de-les-macanes";

const CSP_HEADER =
  "default-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: https: wss: ws://localhost:* http://localhost:*; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' https: data:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://*.socdepoble.org https://socdepoble.org https://*.socdepoble.cat https://socdepoble.cat https://*.sollutia.cat https://sollutia.cat https://*.sollutia.com http://localhost:*;";

const ALLOWED_WEBFINGER_DOMAINS = new Set([
  "socdepoble.cat",
  "www.socdepoble.cat",
  "socdepoble.org",
  "www.socdepoble.org",
  "localhost",
  "127.0.0.1"
]);

const WEBFINGER_ACCOUNTS = new Map([
  ["socdepoble", "socdepoble"],
  ["la-torre-de-les-macanes", "la-torre-de-les-macanes"],
  ["latorredelesmacanes", "la-torre-de-les-macanes"]
]);

function carregaClaus() {
  if (fs.existsSync(KEYS_FILE)) {
    return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const claus = {
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }),
    fingerprint: crypto.createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex"),
    creat: new Date().toISOString()
  };
  fs.writeFileSync(KEYS_FILE, JSON.stringify(claus, null, 2), { mode: 0o600 });
  return claus;
}

const CLAUS = carregaClaus();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonld": "application/ld+json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xrd+xml; charset=utf-8",
  ".ics": "text/calendar; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf"
};

const COMPRESSIBLE_EXTS = new Set([
  ".html", ".js", ".mjs", ".css", ".json", ".jsonld",
  ".webmanifest", ".svg", ".txt", ".md", ".xml", ".ics"
]);

function capcaleresBase(contentType) {
  return {
    "Content-Type": contentType,
    "Content-Security-Policy": CSP_HEADER,
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self)",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-SDP-Node": "node0-la-torre-mac-mini-m4",
    "X-SDP-Key-SHA256": CLAUS.fingerprint
  };
}

function enviaJson(res, status, payload, contentType = "application/json; charset=utf-8", extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    ...capcaleresBase(contentType),
    "Access-Control-Allow-Origin": "*",
    ...extraHeaders
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "socdepoble.cat").split(",")[0].trim();
  const isLocalHost = hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1");
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();

  // R5N-02: Redirecció estricta HTTP -> HTTPS quan passa per proxy públic
  if (!isLocalHost && forwardedProto === "http") {
    const httpsLocation = `https://${hostHeader}${req.url || "/"}`;
    res.writeHead(301, {
      ...capcaleresBase("text/plain; charset=utf-8"),
      "Location": httpsLocation,
      "Cache-Control": "public, max-age=3600"
    });
    return res.end(`Redirecting to ${httpsLocation}`);
  }

  const originBase = isLocalHost ? `http://${hostHeader}` : `https://${hostHeader}`;
  const canonicalDomain = hostHeader.split(":")[0].replace(/^www\./i, "").toLowerCase();

  let url;
  let pathname;
  try {
    url = new URL(req.url || "/", originBase);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return enviaJson(res, 400, { error: "URL malformada" });
  }

  // R5N-07: Inbox ActivityPub explícita (no ha de caure al fallback SPA 200)
  if (pathname.startsWith("/ap/inbox")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        ...capcaleresBase("text/plain; charset=utf-8"),
        "Allow": "POST, OPTIONS",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      });
      return res.end();
    }
    if (req.method === "GET" || req.method === "HEAD") {
      return enviaJson(
        res,
        405,
        {
          error: "La bústia d'entrada ActivityPub no admet lectura GET/HEAD.",
          allow: ["POST", "OPTIONS"]
        },
        "application/activity+json; charset=utf-8",
        { "Allow": "POST, OPTIONS" }
      );
    }
    return enviaJson(
      res,
      501,
      {
        error: "Inbox ActivityPub en fase 1 (descoberta signada): recepció remota d'activitats encara no activada en este node pilot."
      },
      "application/activity+json; charset=utf-8"
    );
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      ...capcaleresBase("text/plain; charset=utf-8"),
      "Allow": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS"
    });
    return res.end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return enviaJson(res, 405, { error: "Mètode no permés al Node 0 frontal (Opció A)", allow: ["GET", "HEAD", "OPTIONS"] }, "application/json; charset=utf-8", {
      "Allow": "POST, GET, HEAD, OPTIONS".replace("POST, ", "")
    });
  }

  if (pathname === "/__node0/config.js") {
    const jsBody = `window.SocDePobleConfig = ${JSON.stringify({ poble: NODE0_POBLE_ID, nomPoble: NODE0_NOM_POBLE })};\n`;
    res.writeHead(200, {
      ...capcaleresBase("application/javascript; charset=utf-8"),
      "Cache-Control": "no-cache"
    });
    return res.end(req.method === "HEAD" ? undefined : jsBody);
  }

  // R5N-03: /api/estat honest, sense presentar la candidatura com una beca concedida
  if (pathname === "/api/estat" || pathname === "/__node0/health" || pathname === "/health") {
    return enviaJson(res, 200, {
      schema: "sdp.node-sobira.v1",
      nodeId: "node0-la-torre-de-les-macanes",
      nomPoble: NODE0_NOM_POBLE,
      municipi: "La Torre de les Maçanes",
      dominiSobira: "https://socdepoble.cat",
      tunnelId: "2ffa3e6b-60d7-48fe-8ff0-3e720bd7e135",
      tunnelName: "node0-latorre",
      mapaDominis: {
        central: "https://socdepoble.org",
        nodeLocalMac: "https://socdepoble.cat",
        wordpress: "https://gentdelatorre.net",
        llavorHistorica: "https://socdepoble.net",
        redireccionsCom: ["https://socdepoble.com", "https://somdepoble.com"]
      },
      maquinari: {
        model: "Mac mini Apple M4",
        cpu: os.cpus()[0]?.model || "Apple M4",
        nuclis: os.cpus().length,
        ramGb: Math.round(os.totalmem() / (1024 ** 3)),
        plataforma: `${os.platform()}-${os.arch()}`,
        uptimeSegons: Math.round(os.uptime())
      },
      fediversity: {
        expedient: "NLnet NGI Fediversity (2026-08-1a6)",
        estatCandidatura: "no-seleccionada-primera-ronda-2026-10-31",
        financamentConcedit: false,
        protocols: ["ActivityPub", "WebFinger (RFC 7033)", "NodeInfo 2.1", "Open Data 1.1.0"],
        publicKeySha256: CLAUS.fingerprint
      },
      estat: "pilot-operatiu",
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === "/.well-known/nodeinfo") {
    return enviaJson(res, 200, {
      links: [
        {
          rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
          href: `${originBase}/nodeinfo/2.1.json`
        }
      ]
    });
  }

  // R5N-08: NodeInfo 2.1 amb versió i URL de programari real verificable (200 OK)
  if (pathname === "/nodeinfo/2.1.json") {
    return enviaJson(res, 200, {
      version: "2.1",
      software: {
        name: "socdepoble",
        version: "1.1.12",
        repository: "https://wordpress.org/plugins/socdepoble/",
        homepage: originBase
      },
      protocols: ["activitypub"],
      services: { inbound: [], outbound: [] },
      openRegistrations: false,
      usage: {
        users: { total: 2, activeHalfyear: 2, activeMonth: 2 },
        localPosts: 10,
        localComments: 0
      },
      metadata: {
        nodeName: "Node 0 · La Torre de les Maçanes (socdepoble.cat)",
        nodeDescription: "Node físic comunitari (Mac mini Apple M4, 24 GiB RAM) de Sóc de Poble a La Torre de les Maçanes.",
        nodeId: "node0-la-torre-mac-mini-m4",
        publicKeySha256: CLAUS.fingerprint,
        federationPhase: "phase1-static-signed-manifest",
        municipality: "La Torre de les Maçanes"
      }
    });
  }

  if (pathname === "/federation/node-manifest.json") {
    const payload = {
      schema: "sdp.node-manifest.v1",
      nodeId: "node0-la-torre-mac-mini-m4",
      origin: "https://socdepoble.cat",
      municipi: "La Torre de les Maçanes",
      hardware: "Mac mini Apple M4 (10 cores, 24 GiB RAM)",
      publicKeySha256: CLAUS.fingerprint,
      publicKeyPem: CLAUS.publicKeyPem,
      issuedAt: new Date().toISOString()
    };
    const canonical = JSON.stringify(payload);
    const signatureBase64 = crypto.sign(null, Buffer.from(canonical, "utf8"), CLAUS.privateKeyPem).toString("base64");
    return enviaJson(res, 200, {
      ...payload,
      signature: {
        algorithm: "Ed25519",
        canonicalPayload: canonical,
        valueBase64: signatureBase64
      }
    });
  }

  // R5N-04: Actors ActivityPub amb id del domini actual i publicKeyPem Ed25519
  const actorMatch = /^\/ap\/actors\/(socdepoble|la-torre-de-les-macanes)\.json$/.exec(pathname);
  if (actorMatch) {
    const slug = actorMatch[1];
    const actorFile = path.join(PUBLIC_DIR, "ap", "actors", `${slug}.json`);
    if (fs.existsSync(actorFile)) {
      const raw = fs.readFileSync(actorFile, "utf8").replaceAll("https://socdepoble.org", originBase);
      const actorObj = JSON.parse(raw);
      actorObj["@context"] = [
        "https://www.w3.org/ns/activitystreams",
        "https://w3id.org/security/v1"
      ];
      actorObj.publicKey = {
        id: `${originBase}/ap/actors/${slug}.json#main-key`,
        owner: `${originBase}/ap/actors/${slug}.json`,
        publicKeyPem: CLAUS.publicKeyPem
      };
      return enviaJson(res, 200, actorObj, "application/activity+json; charset=utf-8");
    }
  }

  // Outbox i followers ActivityPub reescrits al domini actual
  const apCollectionMatch = /^\/ap\/(outbox|followers)\/(socdepoble|la-torre-de-les-macanes)\.json$/.exec(pathname);
  if (apCollectionMatch) {
    const [, kind, slug] = apCollectionMatch;
    const colFile = path.join(PUBLIC_DIR, "ap", kind, `${slug}.json`);
    if (fs.existsSync(colFile)) {
      const body = fs.readFileSync(colFile, "utf8").replaceAll("https://socdepoble.org", originBase);
      res.writeHead(200, {
        ...capcaleresBase("application/activity+json; charset=utf-8"),
        "Access-Control-Allow-Origin": "*"
      });
      return res.end(req.method === "HEAD" ? undefined : body);
    }
  }

  // host-meta reescrit al domini actual
  if (pathname === "/.well-known/host-meta") {
    const hostMetaFile = path.join(PUBLIC_DIR, ".well-known", "host-meta");
    if (fs.existsSync(hostMetaFile)) {
      const body = fs.readFileSync(hostMetaFile, "utf8").replaceAll("https://socdepoble.org", originBase);
      res.writeHead(200, {
        ...capcaleresBase("application/xrd+xml; charset=utf-8"),
        "Access-Control-Allow-Origin": "*"
      });
      return res.end(req.method === "HEAD" ? undefined : body);
    }
  }

  // R5N-05: WebFinger RFC 7033 estricte (?resource=acct:usuari@domini) i per camí
  if (pathname === "/.well-known/webfinger" || pathname.startsWith("/.well-known/webfinger/")) {
    let resource = url.searchParams.get("resource") || "";
    if (!resource && pathname.startsWith("/.well-known/webfinger/")) {
      const tail = pathname.slice("/.well-known/webfinger/".length);
      if (tail.endsWith(".json")) {
        const baseName = tail.slice(0, -5).toLowerCase();
        if (WEBFINGER_ACCOUNTS.has(baseName)) {
          resource = `acct:${baseName}@${canonicalDomain}`;
        }
      } else {
        resource = tail;
      }
    }

    if (!resource) {
      return enviaJson(
        res,
        400,
        { error: "Falta el paràmetre obligatori ?resource=acct:usuari@domini (RFC 7033 §4.2)." },
        "application/jrd+json; charset=utf-8"
      );
    }

    const match = /^acct:([^@]+)@([^@]+)$/i.exec(resource.trim());
    if (!match) {
      return enviaJson(
        res,
        404,
        { error: "Recurs WebFinger no reconegut.", resource },
        "application/jrd+json; charset=utf-8"
      );
    }

    const usuari = match[1].toLowerCase();
    const domini = match[2].toLowerCase().split(":")[0];
    const slug = WEBFINGER_ACCOUNTS.get(usuari);

    if (!slug || !ALLOWED_WEBFINGER_DOMAINS.has(domini)) {
      return enviaJson(
        res,
        404,
        { error: "Compte no trobat en este node.", resource },
        "application/jrd+json; charset=utf-8"
      );
    }

    const jrdFile = path.join(PUBLIC_DIR, ".well-known", "webfinger", `${slug}.json`);
    if (fs.existsSync(jrdFile)) {
      const raw = fs.readFileSync(jrdFile, "utf8")
        .replaceAll("https://socdepoble.org", originBase)
        .replaceAll("@socdepoble.org", `@${canonicalDomain}`);
      const jrdObj = JSON.parse(raw);
      jrdObj.subject = `acct:${slug}@${canonicalDomain}`;
      res.writeHead(200, {
        ...capcaleresBase("application/jrd+json; charset=utf-8"),
        "Access-Control-Allow-Origin": "*"
      });
      return res.end(req.method === "HEAD" ? undefined : JSON.stringify(jrdObj, null, 2));
    }
  }

  // Bloqueja qualsevol fitxer ocult excepte /.well-known/
  const segments = pathname.split("/").filter(Boolean);
  if (segments.some((s, idx) => s.startsWith(".") && !(idx === 0 && s === ".well-known"))) {
    return enviaJson(res, 404, { error: "No trobat" });
  }

  // Manifest signat Ed25519 + SHA-256 de la carpeta d'arxius pesants (/media/manifest.json)
  if (pathname === "/media/manifest.json") {
    const items = fs.readdirSync(MEDIA_DIR)
      .filter((name) => !name.startsWith(".") && name !== "manifest.json")
      .sort()
      .flatMap((name) => {
        const fullPath = path.join(MEDIA_DIR, name);
        const st = fs.statSync(fullPath);
        if (!st.isFile()) return [];
        const extName = path.extname(name).toLowerCase();
        const sha256Hex = crypto.createHash("sha256").update(fs.readFileSync(fullPath)).digest("hex");
        return [{
          name,
          url: `${originBase}/media/${encodeURIComponent(name)}`,
          bytes: st.size,
          mimeType: MIME_TYPES[extName] || "application/octet-stream",
          sha256: sha256Hex,
          updatedAt: st.mtime.toISOString()
        }];
      });
    const payload = {
      schema: "sdp.node-media-manifest.v1",
      nodeId: "node0-la-torre-mac-mini-m4",
      origin: originBase,
      publicKeySha256: CLAUS.fingerprint,
      publicKeyPem: CLAUS.publicKeyPem,
      items
    };
    const canonical = JSON.stringify(payload);
    const signatureBase64 = crypto.sign(null, Buffer.from(canonical, "utf8"), CLAUS.privateKeyPem).toString("base64");
    return enviaJson(res, 200, {
      ...payload,
      signature: {
        algorithm: "Ed25519",
        valueBase64: signatureBase64
      }
    });
  }

  // Servei d'arxius pesants (/media/*) amb suport HTTP Range (206 Partial Content) i CORP/CORS obert
  if (pathname.startsWith("/media/")) {
    const mediaRel = pathname.slice("/media/".length).replace(/^\/+/, "");
    const mediaCandidate = path.resolve(MEDIA_DIR, mediaRel);
    if (!mediaCandidate.startsWith(MEDIA_DIR) || !fs.existsSync(mediaCandidate) || !fs.statSync(mediaCandidate).isFile()) {
      return enviaJson(res, 404, { error: "Recurs multimèdia no trobat al Node 0", path: pathname });
    }
    const mediaStat = fs.statSync(mediaCandidate);
    const mediaExt = path.extname(mediaCandidate).toLowerCase();
    const mediaType = MIME_TYPES[mediaExt] || "application/octet-stream";
    const baseMediaHeaders = {
      ...capcaleresBase(mediaType),
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=31536000, immutable"
    };
    const rangeHeader = req.headers.range;
    if (rangeHeader && /^bytes=\d*-\d*$/.test(String(rangeHeader).trim())) {
      const [startStr, endStr] = String(rangeHeader).trim().replace(/^bytes=/, "").split("-");
      let start = startStr ? Number.parseInt(startStr, 10) : 0;
      let end = endStr ? Number.parseInt(endStr, 10) : mediaStat.size - 1;
      if (!startStr && endStr) {
        start = Math.max(0, mediaStat.size - Number.parseInt(endStr, 10));
        end = mediaStat.size - 1;
      }
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= mediaStat.size) {
        res.writeHead(416, {
          ...baseMediaHeaders,
          "Content-Range": `bytes */${mediaStat.size}`
        });
        return res.end();
      }
      end = Math.min(end, mediaStat.size - 1);
      const chunkLength = end - start + 1;
      res.writeHead(206, {
        ...baseMediaHeaders,
        "Content-Range": `bytes ${start}-${end}/${mediaStat.size}`,
        "Content-Length": chunkLength
      });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(mediaCandidate, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, {
      ...baseMediaHeaders,
      "Content-Length": mediaStat.size
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(mediaCandidate).pipe(res);
    return;
  }

  // Resolució segura dins de PUBLIC_DIR
  const relPath = pathname.replace(/^\/+/, "");
  let candidate = path.resolve(PUBLIC_DIR, relPath);
  if (!candidate.startsWith(PUBLIC_DIR)) {
    return enviaJson(res, 403, { error: "Accés denegat" });
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, "index.html");
  }

  // Rutes de dades o codi font mai han de caure al fallback SPA
  const isSpaProtectedPrefix =
    pathname.startsWith("/ap/") ||
    pathname.startsWith("/opendata/") ||
    pathname.startsWith("/nodeinfo/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/src/");

  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    if (!path.extname(pathname) && !isSpaProtectedPrefix) {
      candidate = path.join(PUBLIC_DIR, "index.html");
    } else {
      return enviaJson(res, 404, { error: "Recurs no trobat", path: pathname });
    }
  }

  const ext = path.extname(candidate).toLowerCase();
  let contentType = MIME_TYPES[ext] || "application/octet-stream";
  if (pathname.startsWith("/ap/")) {
    contentType = "application/activity+json; charset=utf-8";
  } else if (pathname === "/.well-known/host-meta") {
    contentType = "application/xrd+xml; charset=utf-8";
  }

  const stat = fs.statSync(candidate);
  const acceptEncoding = String(req.headers["accept-encoding"] || "");
  const useGzip = COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes("gzip") && stat.size > 256;

  let cacheControl = "public, max-age=300";
  if (pathname.startsWith("/assets/")) {
    cacheControl = "public, max-age=31536000, immutable";
  } else if (ext === ".html") {
    cacheControl = "no-cache";
  } else if ([".webp", ".png", ".jpg", ".jpeg", ".svg", ".woff2", ".woff", ".ttf"].includes(ext)) {
    cacheControl = "public, max-age=86400";
  }

  const headers = {
    ...capcaleresBase(contentType),
    "Cache-Control": cacheControl,
    "Vary": "Accept-Encoding",
    ...(pathname.startsWith("/ap/") || pathname.startsWith("/.well-known/") || pathname.startsWith("/nodeinfo/") || pathname.startsWith("/opendata/")
      ? { "Access-Control-Allow-Origin": "*" }
      : {})
  };

  if (path.basename(candidate) === "index.html") {
    let html = fs.readFileSync(candidate, "utf8");
    if (!html.includes("/__node0/config.js")) {
      html = html.replace(
        "<script type=\"module\"",
        "<script src=\"/__node0/config.js\"></script>\n    <script type=\"module\""
      );
    }
    const buf = Buffer.from(html, "utf8");
    if (useGzip && req.method === "GET") {
      const gz = zlib.gzipSync(buf, { level: 6 });
      headers["Content-Encoding"] = "gzip";
      headers["Content-Length"] = gz.length;
      res.writeHead(200, headers);
      return res.end(gz);
    }
    headers["Content-Length"] = buf.length;
    res.writeHead(200, headers);
    return res.end(req.method === "HEAD" ? undefined : buf);
  }

  if (useGzip && req.method === "GET") {
    headers["Content-Encoding"] = "gzip";
    res.writeHead(200, headers);
    fs.createReadStream(candidate).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    return;
  }

  headers["Content-Length"] = stat.size;
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(candidate).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Node 0 Sóc de Poble] Escoltant a http://0.0.0.0:${PORT}`);
});
