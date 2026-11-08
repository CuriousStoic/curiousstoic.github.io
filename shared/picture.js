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
  css.href = "/shared/picture.css?v=3";
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
  load().then((t) => {
    if (!t || !t.pic || !t.pic.url) return;
    document.documentElement.classList.add("csp-ready");
    dressBanners(t.pic.url);
  });
})();
