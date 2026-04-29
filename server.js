const http = require("node:http");
const { readFile, writeFile, mkdir } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3010);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const TOKEN_PATH = path.join(DATA_DIR, "admin-token.txt");

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
};

const initialDb = {
  events: [],
  inquiries: [],
  reviews: [],
};

async function ensureDb() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    await writeFile(DB_PATH, JSON.stringify(initialDb, null, 2));
  }
  if (!process.env.ADMIN_TOKEN && !existsSync(TOKEN_PATH)) {
    await writeFile(TOKEN_PATH, `${crypto.randomBytes(18).toString("hex")}\n`);
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

async function requireAdmin(req, res) {
  const expected = await adminToken();
  const provided = req.headers["x-admin-token"];
  if (!provided || provided !== expected) {
    sendError(res, 401, "Token admin inválido.");
    return false;
  }
  return true;
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

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
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

function publicEvents(events) {
  const today = new Date().toISOString().slice(0, 10);
  return events
    .filter((event) => event.published && event.date >= today)
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`));
}

async function handleApi(req, res, url) {
  const db = await readDb();

  if (req.method === "GET" && url.pathname === "/api/events") {
    const admin = url.searchParams.get("admin") === "1";
    if (admin && !(await requireAdmin(req, res))) return;
    const events = admin ? db.events : publicEvents(db.events);
    return sendJson(res, 200, { events });
  }

  if (req.method === "POST" && url.pathname === "/api/events") {
    if (!(await requireAdmin(req, res))) return;
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
    return sendJson(res, 201, { event });
  }

  const eventMatch = url.pathname.match(/^\/api\/events\/([^/]+)$/);
  if (eventMatch && req.method === "PUT") {
    if (!(await requireAdmin(req, res))) return;
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
    return sendJson(res, 200, { event });
  }

  if (eventMatch && req.method === "DELETE") {
    if (!(await requireAdmin(req, res))) return;
    const before = db.events.length;
    db.events = db.events.filter((item) => item.id !== eventMatch[1]);
    if (db.events.length === before) return sendError(res, 404, "Evento não encontrado.");
    await writeDb(db);
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
    if (!(await requireAdmin(req, res))) return;
    return sendJson(res, 200, { inquiries: db.inquiries });
  }

  const inquiryMatch = url.pathname.match(/^\/api\/inquiries\/([^/]+)$/);
  if (inquiryMatch && req.method === "DELETE") {
    if (!(await requireAdmin(req, res))) return;
    const before = db.inquiries.length;
    db.inquiries = db.inquiries.filter((item) => item.id !== inquiryMatch[1]);
    if (db.inquiries.length === before) return sendError(res, 404, "Pedido não encontrado.");
    await writeDb(db);
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
    if (!(await requireAdmin(req, res))) return;
    const body = await readBody(req);
    const review = db.reviews.find((item) => item.id === reviewMatch[1]);
    if (!review) return sendError(res, 404, "Avaliação não encontrada.");
    review.approved = Boolean(body.approved);
    review.updatedAt = new Date().toISOString();
    await writeDb(db);
    return sendJson(res, 200, { review });
  }

  if (reviewMatch && req.method === "DELETE") {
    if (!(await requireAdmin(req, res))) return;
    const before = db.reviews.length;
    db.reviews = db.reviews.filter((item) => item.id !== reviewMatch[1]);
    if (db.reviews.length === before) return sendError(res, 404, "Avaliação não encontrada.");
    await writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 404, "Endpoint não encontrado.");
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
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
