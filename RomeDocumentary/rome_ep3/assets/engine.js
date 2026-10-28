/* engine.js — Rome v8 animation engine (GSAP).
 * Seekable by design: no Date.now, no Math.random, no setTimeout, no infinite repeats.
 * Every tween lives on ONE paused root timeline so the renderer can jump to any frame.
 * It only animates elements that build_v8.py already placed in the HTML (by id),
 * so HyperFrames still sees every element's data-start / data-duration.
 */
(function () {
  const D = window.ROME_DATA;
  const W = 1920, H = 1080;
  const tl = gsap.timeline({ paused: true });
  const $ = (id) => document.getElementById(id);
  const NOW = { immediateRender: false };           // for every tween after the first on a target

  /* ---------- 0. initial state ---------- */
  gsap.set("#world", { transformOrigin: "0 0", x: 0, y: 0, scale: 1 });
  gsap.set("#mood", { opacity: 0 });
  gsap.set("#wipe", { x: -2400 });

  /* ---------- 1. camera (world layer ONLY — captions, banners, chips never scale) ----------
   * Rules learned from the rejected v7 zoom:
   *  - never zoom out inside a chapter, max +0.05 scale per 10 s
   *  - one slow tween per beat, sine.inOut, so beat boundaries are continuous
   *  - clamp so the map edge never shows
   */
  /* city zoom: world layer ONLY, characters live in #cast so they never scale.
     Full view at beat start -> zoom to the city marker when its name appears
     -> back to full view before the beat ends and the next map appears. */
  D.beats.forEach((b) => {
    tl.to("#world", { x: 0, y: 0, scale: 1, duration: 0.8, ease: "sine.inOut" }, b.start);
    const zs = b.zooms && b.zooms.length ? b.zooms : (b.zoom ? [b.zoom] : []);
    zs.forEach((z, zi) => {
      const s = 1.5;
      let x = 960 - z.x * s, y = 540 - z.y * s;
      x = Math.min(0, Math.max(1920 - 1920 * s, x));
      y = Math.min(0, Math.max(1080 - 1080 * s, y));
      tl.to("#world", { x, y, scale: s, duration: 1.2, ease: "sine.inOut" }, Math.max(b.start, z.at - 0.3));
      const backAt = zi + 1 < zs.length ? zs[zi + 1].at - 1.5 : b.end - 2.0;
      tl.to("#world", { x: 0, y: 0, scale: 1, duration: 0.8, ease: "sine.inOut" }, Math.max(b.start + 1.5, backAt));
    });
    /* scene-end background zoom, EVERY beat: zoom IN at beat end,
       next beat's start tween brings it back out to 1.0 on the new map */
    tl.to("#world", { x: 0, y: 0, scale: 1.25, duration: 0.8, ease: "sine.inOut" }, b.end - 0.8);
  });

  /* ---------- 2. mood grading + paper wipe between beats ---------- */
  D.beats.forEach((b) => {
    const m = b.mood || { tint: "#ffcf7a", a: 0.12 };
    tl.to("#mood", { backgroundColor: m.tint, opacity: m.a, duration: 1.2, ease: "sine.inOut" }, Math.max(0, b.start - 0.2));
    if (b.wipe && b.start > 0) {
      tl.fromTo("#wipe", { x: -2400 }, { x: 2400, duration: 0.8, ease: "power2.inOut", immediateRender: false }, b.start - 0.4);
    }
  });

  /* ---------- 3. cast: entry -> idle life -> travel -> exit ---------- */
  const ENTRY = {
    L:    (el, t) => tl.fromTo(el, { x: -700, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: "back.out(1.4)" }, t),
    R:    (el, t) => tl.fromTo(el, { x: 700, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: "back.out(1.4)" }, t),
    drop: (el, t) => tl.fromTo(el, { y: -900, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "bounce.out" }, t),
    pop:  (el, t) => { gsap.set(el, { transformOrigin: "50% 100%" });
                       return tl.fromTo(el, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: "back.out(2)" }, t); },
    rise: (el, t) => tl.fromTo(el, { y: 260, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" }, t),
  };
  const EXIT = {
    fade: (el, t) => tl.to(el, { autoAlpha: 0, y: 20, duration: 0.3, ease: "power2.in", ...NOW }, t),
    fall: (el, t) => { gsap.set(el, { transformOrigin: "50% 100%" });
                       return tl.to(el, { rotation: 88, y: 70, autoAlpha: 0, duration: 0.9, ease: "power2.in", ...NOW }, t); },
    L:    (el, t) => tl.to(el, { x: "-=700", autoAlpha: 0, duration: 0.4, ease: "power2.in", ...NOW }, t),
    R:    (el, t) => tl.to(el, { x: "+=700", autoAlpha: 0, duration: 0.4, ease: "power2.in", ...NOW }, t),
  };

  // finite yoyo loop that never runs past `to` (so the root timeline length stays exact)
  function loop(target, vars, leg, from, to) {
    const reps = Math.floor((to - from) / leg) - 1;
    if (reps < 0) return;
    tl.fromTo(target, vars[0], { ...vars[1], duration: leg, yoyo: true, repeat: reps, ...NOW }, from);
  }

  D.cast.forEach((f) => {
    const wrap = $(f.id), img = wrap.querySelector("img");
    const eT = ENTRY[f.from || "L"](wrap, f.at);
    const live = f.at + 0.7;
    gsap.set(img, { transformOrigin: "50% 100%" });
    if (f.idle !== false && f.end - live > 1) {
      loop(img, [{ rotation: -1.2 }, { rotation: 1.2, ease: "sine.inOut" }], 2.2, live, f.end);   // sway
      loop(img, [{ scaleY: 1 },      { scaleY: 1.018, ease: "sine.inOut" }], 1.6, live, f.end);   // breathe
      loop(img, [{ skewX: 0 },       { skewX: 0.8, ease: "steps(1)" }],      0.125, live, f.end); // 8 fps stop-motion jitter
    }
    if (f.walk) loop(img, [{ y: 0 }, { y: -12, ease: "sine.inOut" }], 0.45, live, f.end);          // walking bob
    if (f.travel) tl.fromTo(wrap, { x: 0, y: 0 }, { x: f.travel[0], y: f.travel[1] || 0, duration: Math.max(0.5, f.end - live), ease: "sine.inOut", ...NOW }, live);
    EXIT[f.exit || "fade"](wrap, f.end);
  });

  /* ---------- 4. map pins + journey routes (inside #world, so they ride the camera) ---------- */
  D.pins.forEach((p) => {
    const dot = $(p.id).querySelector(".dot"), ring = $(p.id).querySelector(".ring");
    tl.fromTo(dot, { y: -320, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "bounce.out" }, p.at);
    tl.fromTo(ring, { scale: 1, opacity: 0.7 }, { scale: 2.8, opacity: 0, duration: 1.2, ease: "power1.out", repeat: 2, ...NOW }, p.at + 0.7);
  });
  D.routes.forEach((r) => {
    const line = $(r.id).querySelector("polyline");
    tl.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: r.dur, ease: "none" }, r.at);
  });

  /* ---------- 5. banners (location names) ---------- */
  D.banners.forEach((b) => {
    const el = $(b.id);
    tl.fromTo(el, { y: -170, rotation: -5, autoAlpha: 0 }, { y: 0, rotation: -1.2, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }, b.at);
    tl.to(el, { y: -40, autoAlpha: 0, duration: 0.3, ease: "power2.in", ...NOW }, b.until - 0.3);
  });

  /* ---------- 6. teaching layer ---------- */
  D.teach.forEach((t) => {
    const el = $(t.id);
    if (t.type === "chip") {
      tl.fromTo(el, { scale: 0.4, rotation: 4, autoAlpha: 0, transformOrigin: "100% 0%" }, { scale: 1, rotation: -0.8, autoAlpha: 1, duration: 0.5, ease: "back.out(1.7)" }, t.at);
      tl.to(el, { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.in", ...NOW }, t.until - 0.3);
    } else if (t.type === "stamp") {
      tl.fromTo(el, { scale: 2.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.22, ease: "power4.in" }, t.at);
      tl.to(el, { autoAlpha: 0, duration: 0.3, ...NOW }, t.until - 0.3);
    } else if (t.type === "hook") {
      const words = el.querySelectorAll("span.w");
      tl.fromTo(words, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.14 }, t.at);
      tl.to(el, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in", ...NOW }, t.until - 0.4);
    } else if (t.type === "tree") {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t.at);
      t.nodes.forEach((n) => tl.fromTo($(n.id), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2)" }, n.at));
      t.links.forEach((l) => tl.fromTo($(l.id), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, l.at));
      tl.to(el, { autoAlpha: 0, duration: 0.4, ...NOW }, t.until - 0.4);
    } else if (t.type === "recap") {                       // end-of-chapter recap: cards pop in one by one
      const cards = el.querySelectorAll(".card");
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t.at);
      tl.fromTo(cards, { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.5)", stagger: t.gap || 1.2 }, t.at + 0.3);
      tl.to(el, { autoAlpha: 0, duration: 0.4, ...NOW }, t.until - 0.4);
    }
  });

  /* ---------- 7. captions (sentence level, key names in gold) ---------- */
  D.captions.forEach((c) => {
    const el = $(c.id);
    tl.fromTo(el, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" }, c.start);
    tl.to(el, { autoAlpha: 0, duration: 0.15, ...NOW }, Math.max(c.start + 0.4, c.end - 0.15));
  });

  /* ---------- 8. film grain (stepped, 8 fps) + exact duration ---------- */
  tl.fromTo("#grain", { backgroundPosition: "0px 0px" }, { backgroundPosition: "-160px 120px", duration: 1, ease: "steps(8)", repeat: Math.floor(D.meta.duration) - 1 }, 0);
  tl.to({}, { duration: 0.001 }, D.meta.duration - 0.001);

  window.__timelines = window.__timelines || {};
  window.__timelines[D.meta.id] = tl;
})();
