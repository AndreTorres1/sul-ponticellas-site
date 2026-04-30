const http = require("node:http");
const { readFile, writeFile, appendFile, mkdir } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3010);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const TOKEN_PATH = path.join(DATA_DIR, "admin-token.txt");
const AUDIT_PATH = path.join(DATA_DIR, "activity-log.csv");
const GOOGLE_SHEETS_AUDIT_URL = cleanEnv(process.env.GOOGLE_SHEETS_AUDIT_URL);
const GOOGLE_SHEETS_AUDIT_SECRET = cleanEnv(process.env.GOOGLE_SHEETS_AUDIT_SECRET);
const GOOGLE_SHEETS_PRIVATE_URL = cleanEnv(process.env.GOOGLE_SHEETS_PRIVATE_URL);
const SITE_URL = cleanEnv(process.env.SITE_URL) || "https://sul-ponticellas-site.onrender.com";

const DEFAULT_TEAM_TOKEN_HASHES = [
  { name: "Andre", role: "owner", hash: "8e9c1d981b419e3b148e54a48c53085f91ff802c5be64749f385d3564c6e02fb" },
  { name: "Paula", role: "member", hash: "e5e91135b2417c1158a24fd9fa60de56c560b954dd48a9453c357a6d7bbefdbb" },
  { name: "Jéssica", role: "member", hash: "4e6f498fcea007a06712d7f09d716cb93219519c93859c1af151c1d9200eba31" },
  { name: "Lorena", role: "member", hash: "2f5e6ccfd35f3efbb381d2525fc6545cb3a37a6fbdfa07a4308d5882eea192ae" },
  { name: "Verónica", role: "member", hash: "f463ba7e1301413c16e2f1494261cf3964232fa407873ec30e617c28f5ab792a" },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8",
};

const initialDb = {
  events: [],
  inquiries: [],
  reviews: [],
};

function cleanEnv(value) {
  return String(value || "").trim();
}

async function ensureDb() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    await writeFile(DB_PATH, JSON.stringify(initialDb, null, 2));
  }
  if (!process.env.ADMIN_TOKEN && !existsSync(TOKEN_PATH)) {
    await writeFile(TOKEN_PATH, `${crypto.randomBytes(18).toString("hex")}\n`);
  }
  if (!existsSync(AUDIT_PATH)) {
    await writeFile(AUDIT_PATH, "createdAt,actor,role,action,entityType,entityId,summary\n");
  }
}

async function readDb() {
  await ensureDb();
  return JSON.parse(await readFile(DB_PATH, "utf8"));
}

async function adminToken() {
  await ensureDb();
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN.trim();
  return (await readFile(TOKEN_PATH, "utf8")).trim();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function configuredTeamTokens() {
  const raw = process.env.TEAM_TOKEN_HASHES;
  if (!raw) return DEFAULT_TEAM_TOKEN_HASHES;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return Object.entries(parsed).map(([name, hash]) => ({ name, hash, role: "member" }));
  } catch {
    return raw.split(",").map((entry) => {
      const [name, hash, role = "member"] = entry.split(":").map((part) => part.trim());
      return { name, hash, role };
    });
  }
}

async function getIdentity(req) {
  const provided = req.headers["x-admin-token"];
  if (!provided) return null;

  const expected = await adminToken();
  if (safeEqual(provided, expected)) return { name: "Andre", role: "owner" };

  const providedHash = hashToken(provided);
  const member = configuredTeamTokens().find((item) => item.hash && safeEqual(providedHash, item.hash));
  if (member) return { name: cleanText(member.name, "Equipa"), role: cleanText(member.role, "member") };

  return null;
}

async function requireAdmin(req, res, options = {}) {
  const identity = await getIdentity(req);
  if (!identity) {
    sendError(res, 401, "Token inválido.");
    return false;
  }
  if (options.ownerOnly && identity.role !== "owner") {
    sendError(res, 403, "Esta ação está reservada ao token principal.");
    return false;
  }
  return identity;
}

async function writeDb(db) {
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function sendCsv(res, status, filename, content) {
  res.writeHead(status, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(content);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function sendText(res, status, contentType, content) {
  res.writeHead(status, {
    "Content-Type": `${contentType}; charset=utf-8`,
    "Cache-Control": "public, max-age=3600",
  });
  res.end(content);
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1024 * 1024) throw new Error("Pedido demasiado grande.");
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("JSON inválido.");
  }
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function auditRecord(actor, action, entityType, entityId, summary) {
  return {
    createdAt: new Date().toISOString(),
    actor: actor?.name || "desconhecido",
    role: actor?.role || "",
    action,
    entityType,
    entityId,
    summary,
  };
}

async function writeLocalAudit(record) {
  const row = [
    record.createdAt,
    record.actor,
    record.role,
    record.action,
    record.entityType,
    record.entityId,
    record.summary,
  ]
    .map(csv)
    .join(",");
  await appendFile(AUDIT_PATH, `${row}\n`);
}

async function writeGoogleAudit(record) {
  if (!GOOGLE_SHEETS_AUDIT_URL || !GOOGLE_SHEETS_AUDIT_SECRET) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(GOOGLE_SHEETS_AUDIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: GOOGLE_SHEETS_AUDIT_SECRET, record }),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function logAudit(actor, action, entityType, entityId, summary) {
  await ensureDb();
  const record = auditRecord(actor, action, entityType, entityId, summary);
  const loggedToGoogle = await writeGoogleAudit(record);
  if (!loggedToGoogle) await writeLocalAudit(record);
}

function publicEvents(events, options = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const includePast = options.includePast === true;
  return events
    .filter((event) => event.published && (includePast || event.date >= today))
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`));
}

async function handleApi(req, res, url) {
  const db = await readDb();

  if (req.method === "GET" && url.pathname === "/api/me") {
    const identity = await requireAdmin(req, res);
    if (!identity) return;
    return sendJson(res, 200, { user: identity });
  }

  if (req.method === "GET" && url.pathname === "/api/audit.csv") {
    const identity = await requireAdmin(req, res, { ownerOnly: true });
    if (!identity) return;
    return sendCsv(res, 200, "sul-ponticellas-activity-log.csv", await readFile(AUDIT_PATH, "utf8"));
  }

  if (req.method === "GET" && url.pathname === "/api/audit-sheet") {
    const identity = await requireAdmin(req, res, { ownerOnly: true });
    if (!identity) return;
    if (!GOOGLE_SHEETS_PRIVATE_URL) return sendError(res, 404, "Google Sheets ainda não configurado.");
    return sendJson(res, 200, { url: GOOGLE_SHEETS_PRIVATE_URL });
  }

  if (req.method === "GET" && url.pathname === "/api/events") {
    const admin = url.searchParams.get("admin") === "1";
    if (admin && !(await requireAdmin(req, res))) return;
    const includePast = url.searchParams.get("scope") === "all";
    const events = admin ? db.events : publicEvents(db.events, { includePast });
    return sendJson(res, 200, { events });
  }

  if (req.method === "POST" && url.pathname === "/api/events") {
    const actor = await requireAdmin(req, res);
    if (!actor) return;
    const body = await readBody(req);
    const title = cleanText(body.title);
    const date = cleanText(body.date);
    if (!title || !date) return sendError(res, 400, "Título e data são obrigatórios.");

    const event = {
      id: id("event"),
      title,
      venue: cleanText(body.venue),
      city: cleanText(body.city),
      country: cleanText(body.country, "España"),
      date,
      time: cleanText(body.time),
      price: cleanText(body.price),
      description: cleanText(body.description),
      ticketUrl: cleanText(body.ticketUrl),
      published: body.published !== false,
      createdAt: new Date().toISOString(),
    };

    db.events.push(event);
    await writeDb(db);
    await logAudit(actor, "create", "event", event.id, `${event.title} (${event.date})`);
    return sendJson(res, 201, { event });
  }

  const eventMatch = url.pathname.match(/^\/api\/events\/([^/]+)$/);
  if (eventMatch && req.method === "PUT") {
    const actor = await requireAdmin(req, res);
    if (!actor) return;
    const body = await readBody(req);
    const event = db.events.find((item) => item.id === eventMatch[1]);
    if (!event) return sendError(res, 404, "Evento não encontrado.");

    Object.assign(event, {
      title: cleanText(body.title, event.title),
      venue: cleanText(body.venue, event.venue),
      city: cleanText(body.city, event.city),
      country: cleanText(body.country, event.country),
      date: cleanText(body.date, event.date),
      time: cleanText(body.time, event.time),
      price: cleanText(body.price, event.price),
      description: cleanText(body.description, event.description),
      ticketUrl: cleanText(body.ticketUrl, event.ticketUrl),
      published: Boolean(body.published),
      updatedAt: new Date().toISOString(),
    });

    await writeDb(db);
    await logAudit(actor, "update", "event", event.id, `${event.title} (${event.date})`);
    return sendJson(res, 200, { event });
  }

  if (eventMatch && req.method === "DELETE") {
    const actor = await requireAdmin(req, res);
    if (!actor) return;
    const before = db.events.length;
    const removed = db.events.find((item) => item.id === eventMatch[1]);
    db.events = db.events.filter((item) => item.id !== eventMatch[1]);
    if (db.events.length === before) return sendError(res, 404, "Evento não encontrado.");
    await writeDb(db);
    await logAudit(actor, "delete", "event", eventMatch[1], removed?.title || "Evento apagado");
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/inquiries") {
    const body = await readBody(req);
    const name = cleanText(body.name);
    const email = cleanText(body.email);
    const message = cleanText(body.message);
    if (!name || !email || !message) {
      return sendError(res, 400, "Nome, email e mensagem são obrigatórios.");
    }

    const inquiry = {
      id: id("inquiry"),
      intent: cleanText(body.intent, "Contacto"),
      name,
      email,
      eventDate: cleanText(body.eventDate),
      eventType: cleanText(body.eventType),
      phone: cleanText(body.phone),
      message,
      createdAt: new Date().toISOString(),
    };

    db.inquiries.unshift(inquiry);
    await writeDb(db);
    return sendJson(res, 201, { inquiry });
  }

  if (req.method === "GET" && url.pathname === "/api/inquiries") {
    if (!(await requireAdmin(req, res, { ownerOnly: true }))) return;
    return sendJson(res, 200, { inquiries: db.inquiries });
  }

  const inquiryMatch = url.pathname.match(/^\/api\/inquiries\/([^/]+)$/);
  if (inquiryMatch && req.method === "DELETE") {
    const actor = await requireAdmin(req, res, { ownerOnly: true });
    if (!actor) return;
    const before = db.inquiries.length;
    const removed = db.inquiries.find((item) => item.id === inquiryMatch[1]);
    db.inquiries = db.inquiries.filter((item) => item.id !== inquiryMatch[1]);
    if (db.inquiries.length === before) return sendError(res, 404, "Pedido não encontrado.");
    await writeDb(db);
    await logAudit(actor, "delete", "inquiry", inquiryMatch[1], removed?.name || "Pedido apagado");
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/reviews") {
    const admin = url.searchParams.get("admin") === "1";
    if (admin && !(await requireAdmin(req, res))) return;
    const reviews = (admin ? db.reviews : db.reviews.filter((review) => review.approved))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return sendJson(res, 200, { reviews });
  }

  if (req.method === "POST" && url.pathname === "/api/reviews") {
    const body = await readBody(req);
    const name = cleanText(body.name);
    const message = cleanText(body.message);
    const rating = Number(body.rating);
    if (!name || !message || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return sendError(res, 400, "Nome, avaliação e mensagem são obrigatórios.");
    }

    const review = {
      id: id("review"),
      name,
      event: cleanText(body.event),
      rating,
      message,
      approved: false,
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(review);
    await writeDb(db);
    return sendJson(res, 201, { review });
  }

  const reviewMatch = url.pathname.match(/^\/api\/reviews\/([^/]+)$/);
  if (reviewMatch && req.method === "PUT") {
    const actor = await requireAdmin(req, res, { ownerOnly: true });
    if (!actor) return;
    const body = await readBody(req);
    const review = db.reviews.find((item) => item.id === reviewMatch[1]);
    if (!review) return sendError(res, 404, "Avaliação não encontrada.");
    review.approved = Boolean(body.approved);
    review.updatedAt = new Date().toISOString();
    await writeDb(db);
    await logAudit(actor, review.approved ? "approve" : "unapprove", "review", review.id, review.name);
    return sendJson(res, 200, { review });
  }

  if (reviewMatch && req.method === "DELETE") {
    const actor = await requireAdmin(req, res, { ownerOnly: true });
    if (!actor) return;
    const before = db.reviews.length;
    const removed = db.reviews.find((item) => item.id === reviewMatch[1]);
    db.reviews = db.reviews.filter((item) => item.id !== reviewMatch[1]);
    if (db.reviews.length === before) return sendError(res, 404, "Avaliação não encontrada.");
    await writeDb(db);
    await logAudit(actor, "delete", "review", reviewMatch[1], removed?.name || "Avaliação apagada");
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 404, "Endpoint não encontrado.");
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/robots.txt") {
    return sendText(
      res,
      200,
      "text/plain",
      `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/\nDisallow: /data/\nSitemap: ${SITE_URL}/sitemap.xml\n`
    );
  }
  if (pathname === "/sitemap.xml") {
    return sendText(
      res,
      200,
      "application/xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`
    );
  }
  if (pathname === "/") pathname = "/index.html";
  if (pathname.startsWith("/data/")) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Forbidden");
  }

  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Não encontrado.");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      });
      return res.end();
    }
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }
    return await serveStatic(req, res, url);
  } catch (error) {
    return sendError(res, 500, error.message || "Erro interno.");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Sul Ponticellas disponível em http://${HOST}:${PORT}`);
  console.log(`Admin local em http://${HOST}:${PORT}/admin.html`);
  adminToken().then((token) => {
    if (process.env.ADMIN_TOKEN) {
      console.log("Token admin carregado por variável de ambiente.");
    } else {
      console.log(`Token admin: ${token}`);
    }
  });
});
