// assets/js/main.js
(function () {
  "use strict";

  function setCurrentYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // Accepts: "2nd March", "2 March", "March 2", "March 2nd", optionally "18:00"
  function parseCountdownTarget(dateText) {
    if (!dateText) return null;

    const months = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };

    const clean = String(dateText)
      .trim()
      .toLowerCase()
      .replace(/(\d+)(st|nd|rd|th)\b/g, "$1")  // 2nd -> 2
      .replace(/,/g, " ");

    // time (optional)
    let hour = 0, minute = 0;
    const tm = clean.match(/\b(\d{1,2}):(\d{2})\b/);
    if (tm) {
      hour = Math.min(23, Math.max(0, Number(tm[1])));
      minute = Math.min(59, Math.max(0, Number(tm[2])));
    }

    // year (optional)
    const ym = clean.match(/\b(20\d{2})\b/);
    const explicitYear = ym ? Number(ym[1]) : null;

    // find month word
    const parts = clean.split(/\s+/).filter(Boolean);
    let monthIndex = null;

    for (const p of parts) {
      if (p in months) {
        monthIndex = months[p];
        break;
      }
    }
    if (monthIndex === null) return null;

    // day = first number 1..31
    const dm = clean.match(/\b([0-9]{1,2})\b/);
    if (!dm) return null;
    const day = Number(dm[1]);
    if (!(day >= 1 && day <= 31)) return null;

    const now = new Date();
    let year = explicitYear ?? now.getFullYear();

    // build candidate target in local time
    let target = new Date(year, monthIndex, day, hour, minute, 0, 0);

    // if no year provided and target already passed, use next year
    if (!explicitYear && target.getTime() <= now.getTime()) {
      year = year + 1;
      target = new Date(year, monthIndex, day, hour, minute, 0, 0);
    }

    return target;
  }

  function initCountdowns() {
    const blocks = document.querySelectorAll('.snapshot-side[aria-label="Countdown"]');
    if (!blocks.length) return;

    blocks.forEach((block) => {
      const dateEl = block.querySelector(".count-date");
      const countEl = block.querySelector(".count");
      const subEl = block.querySelector(".count-sub");

      if (!dateEl || !countEl) return;

      const dateText = dateEl.textContent.trim();
      const target = parseCountdownTarget(dateText);

      if (!target) {
        // keep your placeholder but tell you it's invalid
        if (subEl) subEl.textContent = 'Invalid date. Use e.g. "2nd March" or "March 2".';
        return;
      }

      function tick() {
        const now = new Date();
        let diff = target.getTime() - now.getTime();

        if (diff <= 0) {
          countEl.textContent = "00 : 00 : 00";
          if (subEl) subEl.textContent = "Competition started";
          return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);          // total hours (includes days)
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countEl.textContent = `${pad2(hours)} : ${pad2(minutes)} : ${pad2(seconds)}`;
        if (subEl) subEl.textContent = `Counting down to ${dateText}`;
      }

      tick(); // immediate update
      setInterval(tick, 1000);
    });
  }

  function initSlider(root) {
    const track = root.querySelector(".slider-track");
    const slides = Array.from(root.querySelectorAll(".slide"));
    const prev = root.querySelector(".slider-btn.prev");
    const next = root.querySelector(".slider-btn.next");
    const dotsWrap = root.querySelector(".slider-dots"); // optional

    if (!track || slides.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const INACTIVITY_MS = Number(root.dataset.resume || 5000);
    const AUTO_INTERVAL_MS = Number(root.dataset.interval || 2500);

    const scrollBehavior = () => (reduceMotion.matches ? "auto" : "smooth");

    function maxScroll() {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function atStart() {
      return track.scrollLeft <= 1;
    }

    function atEnd() {
      return track.scrollLeft >= maxScroll() - 1;
    }

    function currentIndex() {
      const left = track.scrollLeft;
      let best = 0;
      let bestDist = Infinity;

      for (let i = 0; i < slides.length; i++) {
        const dist = Math.abs(slides[i].offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    }

    function scrollToIndex(i) {
      const idx = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[idx].offsetLeft, behavior: scrollBehavior() });
      updateUI();
    }

    function go(dir) {
      const i = currentIndex();
      scrollToIndex(i + dir);
    }

    let dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "slider-dot";
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        b.addEventListener("click", () => {
          userInteracted();
          scrollToIndex(i);
        });
        dotsWrap.appendChild(b);
      });
      dots = Array.from(dotsWrap.querySelectorAll(".slider-dot"));
    }

    function updateUI() {
      const i = currentIndex();

      for (let d = 0; d < dots.length; d++) {
        dots[d].classList.toggle("active", d === i);
      }

      if (prev) prev.disabled = atStart();
      if (next) next.disabled = atEnd();
    }

    let raf = 0;
    track.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateUI();
      });
    });

    let autoDir = 1;
    let autoTimer = 0;
    let idleTimer = 0;

    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = 0;
    }

    function startAuto() {
      if (reduceMotion.matches) return;
      if (autoTimer) return;
      if (maxScroll() <= 0) return;

      autoTimer = setInterval(() => {
        if (maxScroll() <= 0) return;

        if (atEnd()) autoDir = -1;
        else if (atStart()) autoDir = 1;

        const idx = currentIndex();
        if (idx <= 0) autoDir = 1;
        if (idx >= slides.length - 1) autoDir = -1;

        go(autoDir);
      }, AUTO_INTERVAL_MS);
    }

    function scheduleResume() {
      stopAuto();
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(startAuto, INACTIVITY_MS);
    }

    function userInteracted() {
      scheduleResume();
    }

    if (prev) {
      prev.addEventListener("click", () => {
        userInteracted();
        go(-1);
      });
    }
    if (next) {
      next.addEventListener("click", () => {
        userInteracted();
        go(1);
      });
    }

    ["wheel", "touchstart", "pointerdown"].forEach((evt) => {
      track.addEventListener(evt, userInteracted, { passive: true });
    });

    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        userInteracted();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        userInteracted();
        go(1);
      }
    });

    function handleResize() {
      updateUI();
      scheduleResume();
    }
    window.addEventListener("resize", handleResize, { passive: true });

    updateUI();
    scheduleResume();
  }

  function initAll() {
    setCurrentYear();
    initCountdowns(); // ✅ real countdown
    document.querySelectorAll("[data-slider]").forEach(initSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  } else {
    initAll();
  }
})();
