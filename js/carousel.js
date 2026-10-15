/* Accessible carousel: no autoplay, previous/next buttons, arrow keys,
   swipe via native scroll-snap, and instant movement under reduced motion. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initCarousel(root) {
    var viewport = root.querySelector(".carousel__viewport");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel__slide"));
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    var status = root.querySelector(".carousel__status");
    var current = 0;
    var scrollTimer;
    var lastTarget = null;

    if (!viewport || slides.length === 0) return;

    slides.forEach(function (slide, i) {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (i + 1) + " of " + slides.length);
    });

    function maxScroll() {
      return viewport.scrollWidth - viewport.clientWidth;
    }

    // Index of the slide whose left edge is nearest the viewport's left edge
    function indexFromScroll() {
      if (viewport.scrollLeft >= maxScroll() - 2) return slides.length - 1;
      var left = viewport.scrollLeft;
      var best = 0;
      var bestDist = Infinity;
      slides.forEach(function (slide, i) {
        var d = Math.abs(slide.offsetLeft - left);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function updateStatus() {
      status.textContent = (current + 1) + " of " + slides.length;
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      var target = Math.min(slides[current].offsetLeft, maxScroll());
      lastTarget = target;
      viewport.scrollTo({ left: target, behavior: reduceMotion.matches ? "auto" : "smooth" });
      updateStatus();
    }

    prev.addEventListener("click", function () { goTo(current - 1); });
    next.addEventListener("click", function () { goTo(current + 1); });

    viewport.addEventListener("keydown", function (e) {
      var handled = true;
      switch (e.key) {
        case "ArrowLeft": goTo(current - 1); break;
        case "ArrowRight": goTo(current + 1); break;
        case "Home": goTo(0); break;
        case "End": goTo(slides.length - 1); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    // Keep the counter in step with touch swipes and trackpad scrolling
    viewport.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        // Near the end two slides can share a scroll position, so keep the one asked for
        if (lastTarget !== null && Math.abs(viewport.scrollLeft - lastTarget) < 2) return;
        lastTarget = null;
        var i = indexFromScroll();
        if (i !== current) { current = i; updateStatus(); }
      }, 120);
    }, { passive: true });

    // When every slide already fits, the controls would do nothing, so hide them
    var controls = root.querySelector(".carousel__controls");
    function updateFit() {
      var fits = maxScroll() <= 1;
      controls.hidden = fits;
      if (fits) {
        viewport.removeAttribute("tabindex");
      } else {
        viewport.setAttribute("tabindex", "0");
      }
    }
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateFit, 150);
    });

    updateFit();
    updateStatus();
  }

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);
})();
