// assets/js/main.js
(function () {
  "use strict";

  function setCurrentYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initSlider(root) {
    const track = root.querySelector(".slider-track");
    const slides = Array.from(root.querySelectorAll(".slide"));
    const prev = root.querySelector(".slider-btn.prev");
    const next = root.querySelector(".slider-btn.next");
    const dotsWrap = root.querySelector(".slider-dots"); // optional

    if (!track || slides.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Config (set via HTML attributes if you want)
    // <div class="slider" data-slider="why" data-resume="5000" data-interval="2500">
    const INACTIVITY_MS = Number(root.dataset.resume || 5000);     // wait 5s after last interaction
    const AUTO_INTERVAL_MS = Number(root.dataset.interval || 2500); // move every 2.5s

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
      updateUI(); // immediate update (scroll listener will also keep it accurate)
    }

    function go(dir) {
      const i = currentIndex();
      scrollToIndex(i + dir);
    }

    // ------- Dots (optional) -------
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

    // Throttle UI updates during scroll (smooth scrolling needs this)
    let raf = 0;
    track.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateUI();
      });
    });

    // ------- Auto (bounce: left->right->left) after inactivity -------
    let autoDir = 1; // 1 right, -1 left
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

        // bounce at ends
        if (atEnd()) autoDir = -1;
        else if (atStart()) autoDir = 1;

        // If we’re at the last/first slide index but not exactly at end/start, still bounce correctly
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

    // Buttons
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

    // Touch / mouse / wheel (counts as interaction)
    ["wheel", "touchstart", "pointerdown"].forEach((evt) => {
      track.addEventListener(evt, userInteracted, { passive: true });
    });

    // Keyboard (while focused)
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
      // don’t leave auto stuck if layout changed
      scheduleResume();
    }
    window.addEventListener("resize", handleResize, { passive: true });

    // Initial
    updateUI();
    scheduleResume();
  }

  function initAll() {
    setCurrentYear();
    document.querySelectorAll("[data-slider]").forEach(initSlider);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  } else {
    initAll();
  }
})();
