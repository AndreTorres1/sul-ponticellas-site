const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const IS_STATIC_HOST = window.location.hostname.endsWith("github.io");
const API_BASES = window.SUL_PONTICELLAS_API
  ? [window.SUL_PONTICELLAS_API]
  : window.location.protocol === "file:"
    ? [
        "https://sul-ponticellas-site.onrender.com",
        "http://127.0.0.1:3013",
        "http://127.0.0.1:3010",
        "http://127.0.0.1:3011",
        "http://127.0.0.1:3012",
      ]
    : [""];
const translations = {
  pt: {
    "meta.title": "Sul Ponticellas | Música ao vivo para casamentos e eventos",
    "meta.description": "Sul Ponticellas oferece quatro violoncelos ao vivo, com a voz da Paula, para casamentos, cerimónias e eventos na Galiza e em Portugal.",
    "nav.home": "Início",
    "nav.services": "Serviços",
    "nav.repertoire": "Repertório",
    "nav.gallery": "Galeria",
    "nav.contact": "Contacto",
    "nav.book": "Reservar",
    "hero.eyebrow": "Música ao vivo",
    "hero.lead": "Cordas, emoção e memórias que ficam para sempre.",
    "hero.cta": "Consultar disponibilidade",
    "hero.secondary": "Ver serviços",
    "hero.scroll": "Descobrir",
    "services.label": "Serviços",
    "services.title": "Música para cada momento da vossa celebração",
    "services.copy": "Adaptamos formato, repertório e presença musical para que cada instante tenha o seu próprio pulso.",
    "services.ceremony.title": "Cerimónia",
    "services.ceremony.copy": "Entrada, votos, assinaturas e saída com quatro violoncelos e, quando fizer sentido, a voz da Paula a dar ainda mais emoção ao momento.",
    "services.ceremony.item1": "Quatro violoncelos",
    "services.ceremony.item2": "Voz da Paula",
    "services.ceremony.item3": "Repertório à medida",
    "services.cocktail.title": "Cocktail e receção",
    "services.cocktail.copy": "Uma atmosfera elegante e próxima, construída pelo timbre quente dos violoncelos e pela possibilidade de acrescentar voz em momentos especiais.",
    "services.cocktail.item1": "Quarteto de violoncelos",
    "services.cocktail.item2": "Pop e clássicos adaptados",
    "services.cocktail.item3": "Voz ao vivo",
    "services.private.title": "Eventos privados",
    "services.private.copy": "Concertos íntimos, jantares, pedidos, aniversários e encontros especiais na Galiza e em Portugal.",
    "services.private.item1": "Sets de 45 a 60 minutos",
    "services.private.item2": "Repertório personalizado",
    "services.private.item3": "Formato flexível",
    "events.label": "Agenda",
    "events.title": "Próximos eventos",
    "events.copy": "Uma zona viva para concertos e aparições públicas. Os eventos são atualizados no painel de administração.",
    "events.loading": "A carregar próximos eventos...",
    "events.empty": "Ainda não há próximos eventos públicos. Quando adicionares no admin, aparecem aqui automaticamente.",
    "events.error": "Para ver eventos, inicia o backend com <code>npm start</code> dentro da pasta do site.",
    "events.static": "Agenda pública em breve. Para datas e disponibilidade, fala connosco por email ou Instagram.",
    "events.tickets": "Entradas",
    "events.book": "Reservar",
    "events.priceFallback": "Consultar",
    "reviews.label": "Avaliações",
    "reviews.title": "O que fica depois da música",
    "reviews.copy": "Depois de uma cerimónia ou evento, as palavras de quem esteve lá ajudam futuros casais a imaginar o seu próprio momento.",
    "reviews.cta": "Deixar avaliação",
    "reviews.loading": "A carregar avaliações...",
    "reviews.empty": "Ainda não há avaliações aprovadas.",
    "reviews.error": "As avaliações aparecem aqui quando o backend estiver ativo.",
    "reviews.static": "As avaliações aprovadas vão aparecer aqui quando o backend estiver ligado ao site online.",
    "reviews.defaultEvent": "Evento Sul Ponticellas",
    "reviews.stars": "de 5 estrelas",
    "reviewForm.title": "Partilhar uma avaliação",
    "reviewForm.copy": "As avaliações só aparecem no site depois de serem aprovadas por ti no painel admin.",
    "reviewForm.event": "Evento",
    "reviewForm.eventPlaceholder": "Casamento, concerto, cerimónia...",
    "reviewForm.rating": "Avaliação",
    "reviewForm.messagePlaceholder": "Conta-nos como foi a experiência...",
    "reviewForm.submit": "Enviar avaliação",
    "reviewForm.saving": "A guardar avaliação...",
    "reviewForm.success": "Avaliação recebida. Fica pendente até ser aprovada no admin.",
    "reviewForm.static": "A recolha de avaliações online fica disponível quando o backend estiver ativo.",
    "repertoire.label": "Repertório",
    "repertoire.title": "Do primeiro acorde ao último brinde",
    "repertoire.copy": "O nosso repertório une música clássica, bandas sonoras, pop, baladas, boleros e peças tradicionais. Se há uma canção que vos pertence, tornamo-la vossa.",
    "gallery.label": "Galeria",
    "gallery.title": "Retratos, palco e aqueles segundos que ficam",
    "about.label": "Nós",
    "about.title": "Um quarteto com raiz galega e alma de celebração",
    "about.copy1": "Somos Sul Ponticellas, um projeto de música ao vivo nascido na Galiza para acompanhar casamentos, cerimónias e momentos que pedem algo mais do que uma playlist.",
    "about.copy2": "Gostamos de tocar perto: escutar a vossa história, entender o lugar, escolher o repertório com delicadeza e transformá-lo numa memória sonora.",
    "about.stat1": "músicas",
    "about.stat2": "formatos",
    "about.stat3": "países",
    "musicians.label": "As músicas",
    "musicians.title": "Quem está por trás do som",
    "musicians.copy": "Uma apresentação breve de cada integrante, para afinar à medida que recebermos os textos finais.",
    "musicians.card1.kicker": "Lorena",
    "musicians.card1.title": "Presença serena",
    "musicians.card1.copy": "Lorena traz ao violoncelo uma presença calma, concentrada e muito musical. A sua forma de tocar acrescenta delicadeza ao grupo e ajuda a criar momentos íntimos, sentidos e cheios de intenção.",
    "musicians.card2.kicker": "Paula",
    "musicians.card2.title": "Prodígio jovem",
    "musicians.card2.copy": "A Paula tem aquela energia rara de quem parece ter nascido dentro da música. Jovem, expressiva e com uma voz incrível, acrescenta brilho, frescura e uma musicalidade muito própria ao grupo.",
    "musicians.card3.kicker": "Verónica",
    "musicians.card3.title": "Som com presença",
    "musicians.card3.copy": "Verónica acrescenta ao quarteto uma presença firme e expressiva. O seu violoncelo ajuda a desenhar a base sonora do grupo, com cuidado, intenção e uma musicalidade muito próxima.",
    "musicians.card4.kicker": "Jéssica",
    "musicians.card4.title": "Portugal no arco",
    "musicians.card4.copy": "Portuguesa, leva já alguns anos no ramo da música e traz ao violoncelo uma presença firme, sensível e muito próxima. É uma das vozes graves que dão corpo e calor ao som de Sul Ponticellas.",
    "musicians.dot": "Ver música",
    "quote": "“A música que soa quando já não fazem falta palavras.”",
    "contact.label": "Contacto",
    "contact.title": "Falem connosco",
    "contact.copy": "Para dúvidas rápidas, repertório, formatos ou disponibilidade geral. Para pedir uma data, usa o botão de reserva.",
    "contact.email.copy": "O melhor canal para pedidos com detalhes e datas.",
    "contact.email.cta": "Escrever email",
    "contact.instagram.copy": "Para acompanhar atuações, bastidores e novidades.",
    "contact.instagram.cta": "Abrir Instagram",
    "contact.booking.kicker": "Reservas",
    "contact.booking.title": "Pedido de disponibilidade",
    "contact.booking.copy": "Se já tens uma data em mente, envia o pedido direto.",
    "contact.booking.cta": "Ir para reserva",
    "booking.label": "Reservar",
    "booking.title": "Pedido de disponibilidade",
    "booking.copy": "Um formulário simples para percebermos a data, o tipo de evento e como vos podemos acompanhar.",
    "booking.date": "Data do evento",
    "booking.eventType": "Tipo de evento",
    "booking.select": "Selecionar...",
    "booking.optionWedding": "Casamento",
    "booking.optionCivil": "Cerimónia civil",
    "booking.optionCocktail": "Cocktail",
    "booking.optionPrivate": "Evento privado",
    "booking.optionConcert": "Concerto",
    "booking.messagePlaceholder": "Conta-nos sobre o evento, formato desejado, repertório...",
    "booking.submit": "Enviar pedido",
    "booking.sending": "A enviar...",
    "booking.success": "Pedido recebido. Ficou guardado no backend e pode ser visto no admin.",
    "booking.static": "A reserva online fica disponível quando o backend estiver ativo. Para já, usa o email ou Instagram acima.",
    "form.name": "Nome",
    "form.namePlaceholder": "Os vossos nomes",
    "form.message": "Mensagem",
    "footer.admin": "Admin",
    "footer.top": "Voltar ao topo",
  },
  es: {
    "meta.title": "Sul Ponticellas | Música en directo para bodas y eventos",
    "meta.description": "Sul Ponticellas ofrece cuatro violonchelos en directo, con la voz de Paula, para bodas, ceremonias y eventos en Galicia y Portugal.",
    "nav.home": "Inicio",
    "nav.services": "Servicios",
    "nav.repertoire": "Repertorio",
    "nav.gallery": "Galería",
    "nav.contact": "Contacto",
    "nav.book": "Reservar",
    "hero.eyebrow": "Música en directo",
    "hero.lead": "Cuerdas, emoción y recuerdos que duran para siempre.",
    "hero.cta": "Consultar disponibilidad",
    "hero.secondary": "Ver servicios",
    "hero.scroll": "Descubrir",
    "services.label": "Servicios",
    "services.title": "Música para cada momento de vuestra celebración",
    "services.copy": "Adaptamos formato, repertorio y presencia musical para que cada instante tenga su propio pulso.",
    "services.ceremony.title": "Ceremonia",
    "services.ceremony.copy": "Entrada, votos, firmas y salida con cuatro violonchelos y, cuando tenga sentido, la voz de Paula para sumar todavía más emoción al momento.",
    "services.ceremony.item1": "Cuatro violonchelos",
    "services.ceremony.item2": "Voz de Paula",
    "services.ceremony.item3": "Repertorio a medida",
    "services.cocktail.title": "Cóctel y recepción",
    "services.cocktail.copy": "Una atmósfera elegante y cercana, construida con el timbre cálido de los violonchelos y la posibilidad de añadir voz en momentos especiales.",
    "services.cocktail.item1": "Cuarteto de violonchelos",
    "services.cocktail.item2": "Pop y clásicos adaptados",
    "services.cocktail.item3": "Voz en directo",
    "services.private.title": "Eventos privados",
    "services.private.copy": "Conciertos íntimos, cenas, propuestas, aniversarios y encuentros especiales en Galicia y Portugal.",
    "services.private.item1": "Sets de 45 a 60 minutos",
    "services.private.item2": "Repertorio personalizado",
    "services.private.item3": "Formato flexible",
    "events.label": "Agenda",
    "events.title": "Próximos eventos",
    "events.copy": "Una zona viva para conciertos y apariciones públicas. Los eventos se actualizan desde el panel de administración.",
    "events.loading": "Cargando próximos eventos...",
    "events.empty": "Todavía no hay próximos eventos públicos. Cuando los añadas en el admin, aparecerán aquí automáticamente.",
    "events.error": "Para ver eventos, inicia el backend con <code>npm start</code> dentro de la carpeta del sitio.",
    "events.static": "Agenda pública próximamente. Para fechas y disponibilidad, escríbenos por email o Instagram.",
    "events.tickets": "Entradas",
    "events.book": "Reservar",
    "events.priceFallback": "Consultar",
    "reviews.label": "Reseñas",
    "reviews.title": "Lo que queda después de la música",
    "reviews.copy": "Después de una ceremonia o evento, las palabras de quienes estuvieron allí ayudan a futuras parejas a imaginar su propio momento.",
    "reviews.cta": "Dejar reseña",
    "reviews.loading": "Cargando reseñas...",
    "reviews.empty": "Todavía no hay reseñas aprobadas.",
    "reviews.error": "Las reseñas aparecerán aquí cuando el backend esté activo.",
    "reviews.static": "Las reseñas aprobadas aparecerán aquí cuando el backend esté conectado al sitio online.",
    "reviews.defaultEvent": "Evento Sul Ponticellas",
    "reviews.stars": "de 5 estrellas",
    "reviewForm.title": "Compartir una reseña",
    "reviewForm.copy": "Las reseñas solo aparecen en el sitio después de que tú las apruebes en el panel admin.",
    "reviewForm.event": "Evento",
    "reviewForm.eventPlaceholder": "Boda, concierto, ceremonia...",
    "reviewForm.rating": "Valoración",
    "reviewForm.messagePlaceholder": "Cuéntanos cómo fue la experiencia...",
    "reviewForm.submit": "Enviar reseña",
    "reviewForm.saving": "Guardando reseña...",
    "reviewForm.success": "Reseña recibida. Queda pendiente hasta que sea aprobada en el admin.",
    "reviewForm.static": "La recogida de reseñas online estará disponible cuando el backend esté activo.",
    "repertoire.label": "Repertorio",
    "repertoire.title": "Del primer acorde al último brindis",
    "repertoire.copy": "Nuestro repertorio une música clásica, bandas sonoras, pop, baladas, boleros y piezas tradicionales. Si hay una canción que os pertenece, la hacemos vuestra.",
    "gallery.label": "Galería",
    "gallery.title": "Retratos, escenario y esos segundos que se quedan",
    "about.label": "Nosotras",
    "about.title": "Un cuarteto con raíz gallega y alma de celebración",
    "about.copy1": "Somos Sul Ponticellas, un proyecto de música en directo nacido en Galicia para acompañar bodas, ceremonias y momentos que piden algo más que una playlist.",
    "about.copy2": "Nos gusta tocar cerca: escuchar vuestra historia, entender el lugar, elegir el repertorio con delicadeza y convertirlo en una memoria sonora.",
    "about.stat1": "músicas",
    "about.stat2": "formatos",
    "about.stat3": "países",
    "musicians.label": "Las músicas",
    "musicians.title": "Quién está detrás del sonido",
    "musicians.copy": "Una breve presentación de cada integrante, para afinarla cuando tengamos los textos finales.",
    "musicians.card1.kicker": "Lorena",
    "musicians.card1.title": "Presencia serena",
    "musicians.card1.copy": "Lorena aporta al violonchelo una presencia tranquila, concentrada y muy musical. Su forma de tocar suma delicadeza al grupo y ayuda a crear momentos íntimos, sentidos y llenos de intención.",
    "musicians.card2.kicker": "Paula",
    "musicians.card2.title": "Prodigio joven",
    "musicians.card2.copy": "Paula tiene esa energía rara de quien parece haber nacido dentro de la música. Joven, expresiva y con una voz increíble, aporta brillo, frescura y una musicalidad muy propia al grupo.",
    "musicians.card3.kicker": "Verónica",
    "musicians.card3.title": "Sonido con presencia",
    "musicians.card3.copy": "Verónica aporta al cuarteto una presencia firme y expresiva. Su violonchelo ayuda a dibujar la base sonora del grupo, con cuidado, intención y una musicalidad muy cercana.",
    "musicians.card4.kicker": "Jéssica",
    "musicians.card4.title": "Portugal en el arco",
    "musicians.card4.copy": "Portuguesa, lleva ya varios años en el mundo de la música y aporta al violonchelo una presencia firme, sensible y muy cercana. Es una de las voces graves que dan cuerpo y calidez al sonido de Sul Ponticellas.",
    "musicians.dot": "Ver música",
    "quote": "“La música que suena cuando ya no hacen falta palabras.”",
    "contact.label": "Contacto",
    "contact.title": "Hablemos",
    "contact.copy": "Para dudas rápidas, repertorio, formatos o disponibilidad general. Para pedir una fecha, usa el botón de reserva.",
    "contact.email.copy": "El mejor canal para pedidos con detalles y fechas.",
    "contact.email.cta": "Escribir email",
    "contact.instagram.copy": "Para seguir actuaciones, bastidores y novedades.",
    "contact.instagram.cta": "Abrir Instagram",
    "contact.booking.kicker": "Reservas",
    "contact.booking.title": "Solicitud de disponibilidad",
    "contact.booking.copy": "Si ya tienes una fecha en mente, envía el pedido directo.",
    "contact.booking.cta": "Ir a reserva",
    "booking.label": "Reservar",
    "booking.title": "Solicitud de disponibilidad",
    "booking.copy": "Un formulario sencillo para entender la fecha, el tipo de evento y cómo podemos acompañaros.",
    "booking.date": "Fecha del evento",
    "booking.eventType": "Tipo de evento",
    "booking.select": "Seleccionar...",
    "booking.optionWedding": "Boda",
    "booking.optionCivil": "Ceremonia civil",
    "booking.optionCocktail": "Cóctel",
    "booking.optionPrivate": "Evento privado",
    "booking.optionConcert": "Concierto",
    "booking.messagePlaceholder": "Cuéntanos sobre vuestro evento, formato deseado, repertorio...",
    "booking.submit": "Enviar pedido",
    "booking.sending": "Enviando...",
    "booking.success": "Pedido recibido. Queda guardado en el backend y puede verse en el admin.",
    "booking.static": "La reserva online estará disponible cuando el backend esté activo. Por ahora, usa el email o Instagram de arriba.",
    "form.name": "Nombre",
    "form.namePlaceholder": "Vuestros nombres",
    "form.message": "Mensaje",
    "footer.admin": "Admin",
    "footer.top": "Volver arriba",
  },
};

const requestedLang = new URLSearchParams(window.location.search).get("lang");
let currentLang = translations[requestedLang] ? requestedLang : localStorage.getItem("sp_lang") || "pt";

function t(key) {
  return translations[currentLang]?.[key] || translations.pt[key] || key;
}

function setMeta(selector, value) {
  document.querySelector(selector)?.setAttribute("content", value);
}

function applyLanguage(lang) {
  currentLang = translations[lang] ? lang : "pt";
  localStorage.setItem("sp_lang", currentLang);
  document.documentElement.lang = currentLang;
  document.title = t("meta.title");
  setMeta("meta[name='description']", t("meta.description"));
  setMeta("meta[property='og:title']", t("meta.title"));
  setMeta("meta[property='og:description']", t("meta.description"));
  setMeta("meta[name='twitter:title']", t("meta.title"));
  setMeta("meta[name='twitter:description']", t("meta.description"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === currentLang));
  });
  document.querySelectorAll(".carousel-dots button").forEach((dot, index) => {
    dot.setAttribute("aria-label", `${t("musicians.dot")} ${index + 1}`);
  });
}

let headerFrame = null;

const syncHeader = () => {
  headerFrame = null;
  header.classList.toggle("is-compact", window.scrollY > 24);
};

const requestHeaderSync = () => {
  if (headerFrame) return;
  headerFrame = window.requestAnimationFrame(syncHeader);
};

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    renderEvents();
    renderReviews();
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    navLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === `#${visible.target.id}`,
      );
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
    threshold: [0.08, 0.2, 0.4],
  },
);

sections.forEach((section) => observer.observe(section));
syncHeader();
window.addEventListener("scroll", requestHeaderSync, { passive: true });

async function api(path, options = {}) {
  let lastError;
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir o pedido.");
      return data;
    } catch (error) {
      lastError = error;
      const isNetworkError =
        error instanceof TypeError ||
        String(error.message).includes("Failed to fetch") ||
        String(error.message).includes("Load failed");
      if (!isNetworkError) break;
    }
  }
  throw lastError || new Error("Não consegui ligar ao backend.");
}

function formatDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  const locale = currentLang === "es" ? "es-ES" : "pt-PT";
  return {
    day: String(parsed.getDate()).padStart(2, "0"),
    month: parsed.toLocaleDateString(locale, { month: "short" }).replace(".", ""),
    weekday: parsed.toLocaleDateString(locale, { weekday: "long" }),
  };
}

async function renderEvents() {
  const list = document.querySelector("[data-events-list]");
  if (!list) return;

  if (IS_STATIC_HOST) {
    list.innerHTML = `
      <article class="empty-state">
        <p>${t("events.static")}</p>
      </article>
    `;
    return;
  }

  try {
    const { events } = await api("/api/events");
    if (!events.length) {
      list.innerHTML = `
        <article class="empty-state">
          <p>${t("events.empty")}</p>
        </article>
      `;
      return;
    }

    list.innerHTML = events
      .map((event) => {
        const date = formatDate(event.date);
        const action = event.ticketUrl
          ? `<a class="event-card__link" href="${event.ticketUrl}" target="_blank" rel="noreferrer">${t("events.tickets")}</a>`
          : `<a class="event-card__link" href="#reservar">${t("events.book")}</a>`;

        return `
          <article class="event-card">
            <div class="event-card__date">
              <strong>${date.day}</strong>
              <span>${date.month}</span>
            </div>
            <div class="event-card__body">
              <p>${date.weekday}${event.time ? ` · ${event.time}` : ""}</p>
              <h3>${event.title}</h3>
              <span>${event.venue}${event.city ? `, ${event.city}` : ""}</span>
              ${event.description ? `<p class="event-card__description">${event.description}</p>` : ""}
            </div>
            <div class="event-card__meta">
              <span>${event.price || t("events.priceFallback")}</span>
              ${action}
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    list.innerHTML = `
      <article class="empty-state">
        <p>${t("events.error")}</p>
      </article>
    `;
  }
}

function stars(rating) {
  return "★★★★★".slice(0, rating);
}

async function renderReviews() {
  const list = document.querySelector("[data-reviews-list]");
  if (!list) return;

  if (IS_STATIC_HOST) {
    list.innerHTML = `
      <article class="empty-state">
        <p>${t("reviews.static")}</p>
      </article>
    `;
    return;
  }

  try {
    const { reviews } = await api("/api/reviews");
    if (!reviews.length) {
      list.innerHTML = `
        <article class="empty-state">
          <p>${t("reviews.empty")}</p>
        </article>
      `;
      return;
    }

    list.innerHTML = reviews
      .map(
        (review) => `
          <article class="review-card">
            <div class="review-card__stars" aria-label="${review.rating} ${t("reviews.stars")}">${stars(review.rating)}</div>
            <p>“${review.message}”</p>
            <footer>
              <strong>${review.name}</strong>
              <span>${review.event || t("reviews.defaultEvent")}</span>
            </footer>
          </article>
        `,
      )
      .join("");
  } catch {
    list.innerHTML = `
      <article class="empty-state">
        <p>${t("reviews.error")}</p>
      </article>
    `;
  }
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setStatus(element, message, tone = "") {
  element.textContent = message;
  element.dataset.tone = tone;
}

const carousel = document.querySelector("[data-carousel]");
if (carousel) {
  const track = carousel.querySelector("[data-carousel-track]");
  const cards = [...track.querySelectorAll(".musician-card")];
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const dots = carousel.querySelector("[data-carousel-dots]");
  let current = 0;

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === current;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-hidden", String(!isActive));
    });
    dots.querySelectorAll("button").forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === current);
      dot.setAttribute("aria-current", dotIndex === current ? "true" : "false");
    });
  }

  cards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `${t("musicians.dot")} ${index + 1}`);
    dot.addEventListener("click", () => goTo(index));
    dots.append(dot);
  });

  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));

  goTo(0);
}

const contactForm = document.querySelector("[data-contact-form]");
if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-contact-status]");
    if (IS_STATIC_HOST) {
      setStatus(status, t("booking.static"), "muted");
      return;
    }
    const payload = formPayload(contactForm);

    try {
      setStatus(status, t("booking.sending"), "muted");
      await api("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      contactForm.reset();
      setStatus(status, t("booking.success"), "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

const reviewForm = document.querySelector("[data-review-form]");
if (reviewForm) {
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-review-status]");
    if (IS_STATIC_HOST) {
      setStatus(status, t("reviewForm.static"), "muted");
      return;
    }
    const payload = formPayload(reviewForm);
    payload.rating = Number(payload.rating);

    try {
      setStatus(status, t("reviewForm.saving"), "muted");
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      reviewForm.reset();
      setStatus(status, t("reviewForm.success"), "success");
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });
}

applyLanguage(currentLang);
renderEvents();
renderReviews();
