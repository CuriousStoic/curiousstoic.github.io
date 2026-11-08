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
  css.href = "/shared/picture.css?v=6";
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
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && ev.isTrusted) close(); });

  // ---------- Breathe: slow breathing on today's picture (her ask, 2026-11-08) ----------
  // In for 4 seconds through the nose, out for 8 slowly "as if through a straw": the breath out twice as long as the breath in
  // (pursed-lip breathing; Huberman: breaths out slow the heart). 5 breaths a minute. She picks 1, 3 or 5 minutes.
  // Sound is off at first (like Instagram); the speaker turns on a soft made "om" tone on each breath out, and a chime at the end.
  // Any element with data-cs-breathe opens it.
  const IN_S = 4, OUT_S = 8;
  let bx = null, timers = [], audio = null, soundOn = false, wake = null, run = null;
  const SPK_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>';
  const SPK_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.4 18.4a9 9 0 0 0 0-12.8"/></svg>';
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; }
  function ctx() {
    if (audio) return audio;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}   // iPhone: play even on silent
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const c = new AC(), master = c.createGain();
    master.gain.value = 0.9; master.connect(c.destination);
    audio = { c, master };
    return audio;
  }
  function om(seconds) {               // a soft, low hum with gentle overtones, rising and fading with the breath out
    const a = soundOn && ctx(); if (!a) return;
    const { c, master } = a, t = c.currentTime;
    const g = c.createGain(), f = c.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 1.2);
    g.gain.setValueAtTime(0.22, t + seconds - 2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds - 0.1);
    g.connect(f); f.connect(master);
    [[136.1, 1], [272.2, 0.3], [408.3, 0.12], [136.6, 0.5]].forEach(([hz, v]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.type = "sine"; o.frequency.value = hz; og.gain.value = v;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + seconds);
    });
  }
  function chime() {
    const a = soundOn && ctx(); if (!a) return;
    const { c, master } = a, t = c.currentTime;
    [[528, 0.18], [792, 0.08]].forEach(([hz, v]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 4.1);
    });
  }
  function setSound(on) {
    soundOn = on;
    const b = bx.querySelector(".csb-sound");
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.innerHTML = (on ? SPK_ON : SPK_OFF) + "<span>" + (on ? "Sound on" : "Sound off") + "</span>";
    if (on) { const a = ctx(); if (a && a.c.state === "suspended") a.c.resume(); }
  }
  async function keepAwake(on) {
    try {
      if (on && navigator.wakeLock && !wake) wake = await navigator.wakeLock.request("screen");
      if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }
  function mmss(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function panel(name) { bx.querySelectorAll(".csb-panel").forEach((p) => { p.hidden = p.dataset.panel !== name; }); }
  function word(text) { bx.querySelector(".csb-word").textContent = text; }
  function buildBreathe(url) {
    bx = el("div", "csb");
    bx.setAttribute("role", "dialog");
    bx.setAttribute("aria-label", "Breathe");
    if (url) bx.style.setProperty("--csp-img", "url('" + String(url).replace(/'/g, "%27") + "')");
    bx.innerHTML =
      '<div class="csb-top"><button class="csb-close" type="button">Close</button><button class="csb-sound" type="button" aria-pressed="false"></button></div>' +
      '<div class="csb-mid"><div class="csb-ring"><div class="csb-ball"></div><span class="csb-word" aria-live="polite">Slow breathing</span></div></div>' +
      '<div class="csb-panel" data-panel="start"><h2>Slow breathing</h2><p>Breathe in through your nose for 4.<br>Breathe out slowly for 8, as if through a straw.</p>' +
      '<div class="csb-picks"><button type="button" data-min="1">1 minute</button><button type="button" data-min="3">3 minutes</button><button type="button" data-min="5">5 minutes</button></div></div>' +
      '<div class="csb-panel" data-panel="run" hidden><p class="csb-count"></p><button class="csb-stop" type="button">Stop</button></div>' +
      '<div class="csb-panel" data-panel="done" hidden><h2>Well done</h2><p class="csb-done"></p><div class="csb-picks"><button type="button" class="csb-again">Again</button><button type="button" class="csb-close2">Close</button></div></div>';
    bx.querySelector(".csb-close").addEventListener("click", closeBreathe);
    bx.querySelector(".csb-close2").addEventListener("click", closeBreathe);
    bx.querySelector(".csb-sound").addEventListener("click", () => setSound(!soundOn));
    bx.querySelector(".csb-stop").addEventListener("click", () => finish(true));
    bx.querySelector(".csb-again").addEventListener("click", () => { panel("start"); word("Slow breathing"); });
    bx.querySelectorAll("[data-min]").forEach((b) => b.addEventListener("click", () => startBreathing(Number(b.dataset.min))));
    document.body.appendChild(bx);
  }
  function startBreathing(min) {
    if (soundOn) { const a = ctx(); if (a && a.c.state === "suspended") a.c.resume(); }   // this tap counts as the iPhone's "user gesture"
    const total = (min * 60) / (IN_S + OUT_S);      // 5, 15 or 25 breaths
    const ball = bx.querySelector(".csb-ball"), count = bx.querySelector(".csb-count");
    run = { total, done: 0, end: Date.now() + min * 60000 };
    panel("run"); keepAwake(true);
    const tick = () => { if (!run) return; count.textContent = "Breath " + Math.min(run.done + 1, run.total) + " of " + run.total + " · " + mmss(Math.max(0, Math.round((run.end - Date.now()) / 1000))) + " left"; later(tick, 1000); };
    tick();
    const breath = () => {
      if (!run) return;
      if (run.done >= run.total) return finish(false);
      word("Breathe in");
      ball.style.transitionDuration = IN_S + "s"; ball.classList.add("full");
      later(() => {
        word("Breathe out");
        ball.style.transitionDuration = OUT_S + "s"; ball.classList.remove("full");
        om(OUT_S);
        later(() => { run.done++; breath(); }, OUT_S * 1000);
      }, IN_S * 1000);
    };
    later(breath, 300);
  }
  function finish(stopped) {
    const n = run ? run.done : 0;
    stopTimers(); run = null; keepAwake(false);
    bx.querySelector(".csb-ball").classList.remove("full");
    word(stopped ? "Rest" : "Done");
    bx.querySelector(".csb-done").textContent = n === 0 ? "Come back any time." : n === 1 ? "1 slow breath." : n + " slow breaths.";
    panel("done");
    if (!stopped) chime();
  }
  function openBreathe() {
    return load().then((t) => t, () => null).then((t) => {
      if (!bx) buildBreathe(t && t.pic && t.pic.url);
      lastFocus = document.activeElement;
      setSound(false);                                // off at first, every time
      panel("start"); word("Slow breathing");
      bx.hidden = false;
      document.documentElement.classList.add("csp-open");
      bx.querySelector(".csb-close").focus();
      // the phone menu may still be open behind: apps close it on Escape
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
  }
  function closeBreathe() {
    if (!bx || bx.hidden) return;
    stopTimers(); run = null; keepAwake(false);
    if (audio && audio.c.state === "running") audio.c.suspend();
    bx.hidden = true;
    document.documentElement.classList.remove("csp-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest("[data-cs-breathe]");
    if (b) { ev.preventDefault(); openBreathe(); }
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && ev.isTrusted) closeBreathe(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && run) finish(true); });
  window.CuriousPicture = { open, close, breathe: openBreathe, ready: () => load().then((t) => !!(t && t.pic && t.pic.url)) };
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
