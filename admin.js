const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:3010" : "";
let adminToken = localStorage.getItem("sp_admin_token") || "";

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { "x-admin-token": adminToken } : {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Pedido falhou.");
  return data;
}

const tokenForm = document.querySelector("[data-token-form]");
const tokenInput = tokenForm.elements.token;
tokenInput.value = adminToken;

tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminToken = tokenInput.value.trim();
  localStorage.setItem("sp_admin_token", adminToken);
  await refresh();
});

function payload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.published = form.elements.published?.checked ?? false;
  return data;
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
                  <small>${fmt(event.date)}${event.time ? ` · ${event.time}` : ""}</small>
                  <h3>${event.title}</h3>
                </div>
                <span class="admin-badge${event.published ? "" : " admin-badge--muted"}">${event.published ? "Publicado" : "Oculto"}</span>
              </div>
              <p>${event.venue || "Sem local"}${event.city ? `, ${event.city}` : ""}</p>
              ${event.description ? `<p>${event.description}</p>` : ""}
              <div class="admin-item__actions">
                <button class="admin-mini-button" data-toggle-event="${event.id}" data-published="${event.published ? "0" : "1"}">${event.published ? "Ocultar" : "Publicar"}</button>
                <button class="admin-mini-button admin-mini-button--danger" data-delete-event="${event.id}">Apagar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="admin-item"><p>Ainda não há eventos.</p></article>`;
}

async function loadInquiries() {
  const target = document.querySelector("[data-admin-inquiries]");
  const { inquiries } = await api("/api/inquiries");
  target.innerHTML = inquiries.length
    ? inquiries
        .map(
          (item) => `
            <article class="admin-item">
              <div class="admin-item__top">
                <div>
                  <small>${new Date(item.createdAt).toLocaleString("pt-PT")}</small>
                  <h3>${item.name}</h3>
                </div>
                <span class="admin-badge">${item.intent}</span>
              </div>
              <p>${item.email}${item.phone ? ` · ${item.phone}` : ""}</p>
              <p>${item.eventType || "Sem tipo"}${item.eventDate ? ` · ${fmt(item.eventDate)}` : ""}</p>
              <p>${item.message}</p>
              <div class="admin-item__actions">
                <button class="admin-mini-button admin-mini-button--danger" data-delete-inquiry="${item.id}">Apagar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="admin-item"><p>Ainda não há pedidos recebidos.</p></article>`;
}

async function loadReviews() {
  const target = document.querySelector("[data-admin-reviews]");
  const { reviews } = await api("/api/reviews?admin=1");
  target.innerHTML = reviews.length
    ? reviews
        .map(
          (review) => `
            <article class="admin-item">
              <div class="admin-item__top">
                <div>
                  <small>${"★★★★★".slice(0, review.rating)} · ${new Date(review.createdAt).toLocaleDateString("pt-PT")}</small>
                  <h3>${review.name}</h3>
                </div>
                <span class="admin-badge${review.approved ? "" : " admin-badge--muted"}">${review.approved ? "Aprovada" : "Pendente"}</span>
              </div>
              <p>${review.event || "Sem evento"}</p>
              <p>${review.message}</p>
              <div class="admin-item__actions">
                <button class="admin-mini-button" data-review="${review.id}" data-approved="${review.approved ? "0" : "1"}">${review.approved ? "Retirar" : "Aprovar"}</button>
                <button class="admin-mini-button admin-mini-button--danger" data-delete-review="${review.id}">Apagar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="admin-item"><p>Ainda não há avaliações.</p></article>`;
}

async function refresh() {
  await Promise.all([loadEvents(), loadInquiries(), loadReviews()]);
}

document.querySelector("[data-event-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus("A guardar...", "muted");
    await api("/api/events", {
      method: "POST",
      body: JSON.stringify(payload(event.currentTarget)),
    });
    event.currentTarget.reset();
    event.currentTarget.elements.country.value = "España";
    event.currentTarget.elements.published.checked = true;
    setStatus("Evento adicionado.", "success");
    await loadEvents();
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
  document.querySelectorAll(".admin-list").forEach((target) => {
    target.innerHTML = `<article class="admin-item"><p>${error.message}</p></article>`;
  });
});
