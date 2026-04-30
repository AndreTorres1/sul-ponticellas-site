const API_BASES =
  window.location.protocol === "file:"
    ? [
        "https://sul-ponticellas-site.onrender.com",
        "http://127.0.0.1:3013",
        "http://127.0.0.1:3010",
        "http://127.0.0.1:3011",
        "http://127.0.0.1:3012",
      ]
    : [""];
let adminToken = normalizeToken(localStorage.getItem("sp_admin_token") || "");
let currentUser = null;

function normalizeToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const lastLine = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) || raw;
  const afterColon = lastLine.includes(":") ? lastLine.split(":").pop().trim() : lastLine;
  return afterColon.split(/\s+/).at(-1) || "";
}

async function api(path, options = {}) {
  let lastError;
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        ...options,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Pedido falhou.");
      return data;
    } catch (error) {
      lastError = error;
      const canTryAnotherLocalPort =
        window.location.protocol === "file:" && String(error.message).includes("Token inválido");
      const isNetworkError =
        error instanceof TypeError ||
        String(error.message).includes("Failed to fetch") ||
        String(error.message).includes("Load failed");
      if (!isNetworkError && !canTryAnotherLocalPort) break;
    }
  }
  if (
    lastError instanceof TypeError ||
    String(lastError?.message).includes("Failed to fetch") ||
    String(lastError?.message).includes("Load failed")
  ) {
    throw new Error("Não consegui ligar ao backend. Usa o painel online ou confirma que o servidor está ativo.");
  }
  throw lastError || new Error("Pedido falhou.");
}

const tokenForm = document.querySelector("[data-token-form]");
const tokenInput = tokenForm.elements.token;
const sessionStatus = document.querySelector("[data-session-status]");
const auditDownload = document.querySelector("[data-audit-download]");
tokenInput.value = adminToken;

tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminToken = normalizeToken(tokenInput.value);
  tokenInput.value = adminToken;
  localStorage.setItem("sp_admin_token", adminToken);
  await refresh();
});

function payload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.published = form.elements.published?.checked ?? false;
  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmt(date) {
  if (!date) return "";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function setStatus(message, tone = "") {
  const status = document.querySelector("[data-event-status]");
  status.textContent = message;
  status.dataset.tone = tone;
}

function protectedMessage(message) {
  return `<article class="admin-item"><p>${escapeHtml(message)}</p></article>`;
}

async function loadSession() {
  if (!adminToken) {
    currentUser = null;
    sessionStatus.textContent = "Sem token guardado.";
    auditDownload.hidden = true;
    return;
  }

  const { user } = await api("/api/me");
  currentUser = user;
  sessionStatus.textContent = `Sessão ativa: ${user.name}${user.role === "owner" ? " · acesso principal" : ""}`;
  auditDownload.hidden = user.role !== "owner";
  auditDownload.textContent = "Descarregar registo Excel";
  auditDownload.removeAttribute("target");

  if (user.role === "owner") {
    try {
      const sheet = await api("/api/audit-sheet");
      auditDownload.textContent = "Abrir Google Sheets";
      auditDownload.href = sheet.url;
      auditDownload.target = "_blank";
      auditDownload.rel = "noreferrer";
    } catch {
      auditDownload.href = "/api/audit.csv";
    }
  }
}

async function loadEvents() {
  const target = document.querySelector("[data-admin-events]");
  const { events } = await api("/api/events?admin=1");
  target.innerHTML = events.length
    ? events
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map(
          (event) => `
            <article class="admin-item">
              <div class="admin-item__top">
                <div>
                  <small>${escapeHtml(fmt(event.date))}${event.time ? ` · ${escapeHtml(event.time)}` : ""}</small>
                  <h3>${escapeHtml(event.title)}</h3>
                </div>
                <span class="admin-badge${event.published ? "" : " admin-badge--muted"}">${event.published ? "Publicado" : "Oculto"}</span>
              </div>
              <p>${escapeHtml(event.venue || "Sem local")}${event.city ? `, ${escapeHtml(event.city)}` : ""}</p>
              ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
              <div class="admin-item__actions">
                <button class="admin-mini-button" data-toggle-event="${escapeHtml(event.id)}" data-published="${event.published ? "0" : "1"}">${event.published ? "Ocultar" : "Publicar"}</button>
                <button class="admin-mini-button admin-mini-button--danger" data-delete-event="${escapeHtml(event.id)}">Apagar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="admin-item"><p>Ainda não há eventos.</p></article>`;
}

async function loadInquiries() {
  const target = document.querySelector("[data-admin-inquiries]");
  let inquiries = [];
  try {
    ({ inquiries } = await api("/api/inquiries"));
  } catch (error) {
    target.innerHTML = protectedMessage(error.message);
    return;
  }
  target.innerHTML = inquiries.length
    ? inquiries
        .map(
          (item) => `
            <article class="admin-item">
              <div class="admin-item__top">
                <div>
                  <small>${escapeHtml(new Date(item.createdAt).toLocaleString("pt-PT"))}</small>
                  <h3>${escapeHtml(item.name)}</h3>
                </div>
                <span class="admin-badge">${escapeHtml(item.intent)}</span>
              </div>
              <p>${escapeHtml(item.email)}${item.phone ? ` · ${escapeHtml(item.phone)}` : ""}</p>
              <p>${escapeHtml(item.eventType || "Sem tipo")}${item.eventDate ? ` · ${escapeHtml(fmt(item.eventDate))}` : ""}</p>
              <p>${escapeHtml(item.message)}</p>
              <div class="admin-item__actions">
                <button class="admin-mini-button admin-mini-button--danger" data-delete-inquiry="${escapeHtml(item.id)}">Apagar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="admin-item"><p>Ainda não há pedidos recebidos.</p></article>`;
}

async function loadReviews() {
  const target = document.querySelector("[data-admin-reviews]");
  let reviews = [];
  try {
    ({ reviews } = await api("/api/reviews?admin=1"));
  } catch (error) {
    target.innerHTML = protectedMessage(error.message);
    return;
  }
  target.innerHTML = reviews.length
    ? reviews
        .map(
          (review) => `
            <article class="admin-item">
              <div class="admin-item__top">
                <div>
                  <small>${"★★★★★".slice(0, review.rating)} · ${escapeHtml(new Date(review.createdAt).toLocaleDateString("pt-PT"))}</small>
                  <h3>${escapeHtml(review.name)}</h3>
                </div>
                <span class="admin-badge${review.approved ? "" : " admin-badge--muted"}">${review.approved ? "Aprovada" : "Pendente"}</span>
              </div>
              <p>${escapeHtml(review.event || "Sem evento")}</p>
              <p>${escapeHtml(review.message)}</p>
              <div class="admin-item__actions">
                <button class="admin-mini-button" data-review="${escapeHtml(review.id)}" data-approved="${review.approved ? "0" : "1"}">${review.approved ? "Retirar" : "Aprovar"}</button>
                <button class="admin-mini-button admin-mini-button--danger" data-delete-review="${escapeHtml(review.id)}">Apagar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="admin-item"><p>Ainda não há avaliações.</p></article>`;
}

async function refresh() {
  await loadSession();
  await Promise.all([loadEvents(), loadInquiries(), loadReviews()]);
}

document.querySelector("[data-event-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    setStatus("A guardar...", "muted");
    await api("/api/events", {
      method: "POST",
      body: JSON.stringify(payload(form)),
    });
    form.reset();
    form.elements.country.value = "España";
    form.elements.published.checked = true;
    setStatus("Evento adicionado.", "success");
    await loadEvents();
  } catch (error) {
    setStatus(error.message, "error");
  }
});

auditDownload.addEventListener("click", async (event) => {
  if (auditDownload.target === "_blank") return;
  event.preventDefault();
  try {
    let response;
    let lastError;
    for (const base of API_BASES) {
      try {
        response = await fetch(`${base}/api/audit.csv`, {
          headers: adminToken ? { "x-admin-token": adminToken } : {},
        });
        if (response.ok) break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!response && lastError) throw lastError;
    if (!response) throw new Error("Não foi possível descarregar o registo.");
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Não foi possível descarregar o registo.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sul-ponticellas-activity-log.csv";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    setStatus(error.message, "error");
  }
});

document.addEventListener("click", async (event) => {
  const deleteEventId = event.target.dataset.deleteEvent;
  const toggleEventId = event.target.dataset.toggleEvent;
  const reviewId = event.target.dataset.review;
  const deleteReviewId = event.target.dataset.deleteReview;
  const deleteInquiryId = event.target.dataset.deleteInquiry;

  if (deleteEventId) {
    await api(`/api/events/${deleteEventId}`, { method: "DELETE" });
    await loadEvents();
  }

  if (toggleEventId) {
    const { events } = await api("/api/events?admin=1");
    const current = events.find((item) => item.id === toggleEventId);
    await api(`/api/events/${toggleEventId}`, {
      method: "PUT",
      body: JSON.stringify({ ...current, published: event.target.dataset.published === "1" }),
    });
    await loadEvents();
  }

  if (reviewId) {
    await api(`/api/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify({ approved: event.target.dataset.approved === "1" }),
    });
    await loadReviews();
  }

  if (deleteInquiryId) {
    await api(`/api/inquiries/${deleteInquiryId}`, { method: "DELETE" });
    await loadInquiries();
  }

  if (deleteReviewId) {
    await api(`/api/reviews/${deleteReviewId}`, { method: "DELETE" });
    await loadReviews();
  }
});

refresh().catch((error) => {
  sessionStatus.textContent = error.message;
  auditDownload.hidden = true;
  document.querySelectorAll(".admin-list").forEach((target) => {
    target.innerHTML = protectedMessage(error.message);
  });
});
