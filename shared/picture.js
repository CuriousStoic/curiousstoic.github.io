// "Just the picture", shared by every Curious Stoic app (her ask, 2026-11-08). One file on curiousstoic.com,
// so a fix here reaches every app. An app adds one line, <script src="/shared/picture.js" defer></script>,
// and gives any button data-cs-picture. The picture and its story come from Morning Notes' public lists,
// so every app shows the same picture as Morning Notes and curiousstoic.com. If anything fails, the app
// carries on as before: the button simply does nothing.
(function () {
  if (window.CuriousPicture) return;
  const BASE = "/notes/data/";
  let lists = null, box = null, lastTap = 0, lastFocus = null;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/shared/picture.css?v=5";
  document.head.appendChild(css);

  function todayIso() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function load() {
    if (lists) return lists;
    const get = (f) => fetch(BASE + f, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    lists = Promise.all([get("wallpapers.json"), get("pictures.json")]).then(([walls, stories]) => {
      const days = Object.keys(walls || {}).sort();
      const day = days.filter((d) => d <= todayIso()).pop() || days[days.length - 1];
      if (!day) { lists = null; return null; }
      return { day, pic: walls[day], story: (stories || {})[day] || {} };
    });
    return lists;
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function build(t) {
    const p = t.pic || {}, s = t.story || {};
    const credit = p.credit || "";
    const m = /\(([^()]*©[^()]*)\)\s*$/.exec(credit);
    const place = s.place || credit.replace(/\s*\([^()]*©[^()]*\)\s*$/, "");
    box = el("div", "csp");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Just the picture");
    box.style.backgroundImage = "url('" + String(p.url || "").replace(/'/g, "%27") + "')";
    const back = el("button", "csp-back", "Back");
    back.type = "button";
    back.addEventListener("click", close);
    const card = el("aside", "csp-card");
    const d = el("details");
    const sum = el("summary");
    sum.append(el("p", "k", "Today's picture"), el("h2", null, s.title || p.title || "A picture from somewhere beautiful"));
    d.appendChild(sum);
    if (place) d.appendChild(el("p", "place", place));
    if (s.text) d.appendChild(el("p", "text", s.text));
    if (credit) d.appendChild(el("p", "by", "Picture " + (m ? m[1] : credit)));
    const tip = el("p", "tip");
    tip.append(el("span", "fill", "Double-tap the picture to see all of it."), el("span", "all", "Double-tap the picture to fill the screen."));
    d.appendChild(tip);
    card.appendChild(d);
    box.append(back, card);
    box.addEventListener("click", (ev) => {                 // double-tap the picture: whole picture, then fill again
      if (ev.target.closest("button, summary, .csp-card")) return;
      const now = Date.now();
      if (now - lastTap < 400) { box.classList.toggle("whole"); lastTap = 0; } else lastTap = now;
    });
    document.body.appendChild(box);
  }
  function open() {
    return load().then((t) => {
      if (!t || !t.pic || !t.pic.url) return;
      lastFocus = document.activeElement;
      if (!box) build(t);
      box.hidden = false;
      box.classList.add("whole");                         // a phone held upright shows all of it first (her ask, 2026-11-08); a double-tap fills the screen
      box.querySelector("details").open = false;          // the card starts folded to its title
      document.documentElement.classList.add("csp-open");
      box.querySelector(".csp-back").focus();
    });
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.documentElement.classList.remove("csp-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest("[data-cs-picture]");
    if (b) { ev.preventDefault(); open(); }
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
  window.CuriousPicture = { open, close, ready: () => load().then((t) => !!(t && t.pic && t.pic.url)) };
  // A Home banner marked data-cs-banner shows today's picture behind its words (her ask, 2026-11-08: "you see the
  // picture already, and then on the picture you tap Just the picture", like Music and Morning Notes). Banners drawn
  // later (after the unlock, or on a new page) are found by watching the page. If the picture fails, the banner stays as it was.
  function dressBanners(url) {
    const css = "url('" + String(url).replace(/'/g, "%27") + "')";
    const dress = (root) => {
      if (!root.querySelectorAll) return;
      const list = root.matches && root.matches("[data-cs-banner]") ? [root] : [];
      list.push(...root.querySelectorAll("[data-cs-banner]"));
      for (const b of list) if (!b.classList.contains("csp-banner")) { b.style.setProperty("--csp-img", css); b.classList.add("csp-banner"); }
    };
    dress(document);
    new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach(dress); }).observe(document.documentElement, { childList: true, subtree: true });
  }
  // The picture card at the top of Home (her ask, 2026-11-08, like Music): the date, "Good morning" and the weather on
  // today's picture, with the "Just the picture" button. An app adds <section class="csp-hero" data-cs-hero="key" hidden>
  // ("visitor" for the sneak peek). Visitors get only the date and "Good morning, friend": no city, no weather.
  // The name: Morning Notes' "This is me" when this phone shares its storage (a home-screen app does not), else Sangya.
  // "friend" is only for visitors, whose name is not known (her rule, 2026-11-08).
  // The place: Morning Notes' last place on this phone, else that person's home city, else Seattle.
  const PEOPLE = { aditya: ["Aditya", "sanfrancisco"], anoushka: ["Anoushka", "seattle"], amit: ["Amit", "seattle"], sangya: ["Sangya", "seattle"] };
  const CITIES = { seattle: { name: "Seattle", lat: 47.6062, lon: -122.3321 }, sanfrancisco: { name: "San Francisco", lat: 37.7749, lon: -122.4194 } };
  const WMO = { 0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "icy fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle", 56: "freezing drizzle", 57: "freezing drizzle", 61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain", 71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains", 80: "light showers", 81: "showers", 82: "heavy showers", 85: "snow showers", 86: "heavy snow showers", 95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with hail" };
  const read = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  function reader() {
    const me = PEOPLE[read("dmn.me") || ""];
    if (me) return { name: me[0], city: CITIES[me[1]] };
    try { const g = JSON.parse(read("dmn.guest") || "null"); if (g && g.name) return { name: String(g.name).split(" ")[0], city: g.place || null }; } catch (e) {}
    return { name: "Sangya", city: CITIES.seattle };       // anyone with the key: her own apps greet her (her rule, 2026-11-08)
  }
  function place(who) {
    try { const c = JSON.parse(read("dmn.where") || "null"); if (c && c.place && c.place.lat != null) return c.place; } catch (e) {}
    return who.city || CITIES.seattle;
  }
  const greeting = (h) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  function clothing(hi, lo) {
    if (hi < 45) return "A warm coat, hat and gloves.";
    if (hi < 55) return "A warm jacket all day.";
    if (hi < 65) return "A light jacket all day.";
    if (hi < 75) return lo < 58 ? "A light layer for the morning, short sleeves by afternoon." : "Short sleeves are fine all day.";
    if (hi < 85) return "Short sleeves and sunglasses.";
    return "Short sleeves, sunscreen and plenty of water.";
  }
  const IMG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
  function fillHero(h, url) {
    if (h.dataset.csDone) return;
    h.dataset.csDone = "1";
    const visitor = h.dataset.csHero === "visitor";
    const who = visitor ? { name: "friend", city: null } : reader();
    const now = new Date();
    h.style.setProperty("--csp-img", "url('" + String(url).replace(/'/g, "%27") + "')");
    h.innerHTML = "";
    const pill = el("button", "csp-pill csp-hero-pill");
    pill.type = "button";
    pill.setAttribute("data-cs-picture", "");
    pill.innerHTML = IMG + "<span>Just the picture</span>";
    const date = el("div", "csp-hero-date", now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    const greet = el("h2", "csp-hero-greet", greeting(now.getHours()) + ", " + who.name);
    h.append(pill, date, greet);
    h.hidden = false;
    if (visitor) return;
    const p = place(who), line = el("p", "csp-hero-line", p.name + " · checking the weather…");
    h.appendChild(line);
    const metric = p.metric === true || (p.cc && p.cc !== "US") || (p.country_code && p.country_code !== "US");
    const deg = (f) => (metric ? Math.round((f - 32) * 5 / 9) + "°C" : Math.round(f) + "°F");
    const q = new URLSearchParams({ latitude: p.lat, longitude: p.lon, daily: "temperature_2m_max,temperature_2m_min", current: "temperature_2m,weather_code", timezone: "auto", temperature_unit: "fahrenheit", forecast_days: "1" });
    fetch("https://api.open-meteo.com/v1/forecast?" + q).then((r) => r.json()).then((w) => {
      const c = w.current || {}, d = w.daily || {};
      const hi = d.temperature_2m_max && d.temperature_2m_max[0], lo = d.temperature_2m_min && d.temperature_2m_min[0];
      line.textContent = p.name + " · " + deg(c.temperature_2m) + ", " + (WMO[c.weather_code] || "") + " right now." + (hi != null && lo != null ? " " + clothing(hi, lo) : "");
    }).catch(() => { line.textContent = p.name + " · weather unavailable right now."; });
  }
  function watch(sel, fn) {
    const run = (root) => {
      if (!root.querySelectorAll) return;
      const list = root.matches && root.matches(sel) ? [root] : [];
      list.push(...root.querySelectorAll(sel));
      list.forEach(fn);
    };
    run(document);
    new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach(run); }).observe(document.documentElement, { childList: true, subtree: true });
  }
  load().then((t) => {
    if (!t || !t.pic || !t.pic.url) return;
    document.documentElement.classList.add("csp-ready");
    dressBanners(t.pic.url);
    watch("[data-cs-hero]", (h) => fillHero(h, t.pic.url));
  });
})();
