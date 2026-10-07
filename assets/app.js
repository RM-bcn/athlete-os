/* Athlete OS — gedeelde interactie. Geen dependencies, werkt offline. */
(function () {
  "use strict";

  /* ---------- scroll-reveal ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealables.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- progressierail ---------- */
  var rail = document.querySelector(".rail");
  if (rail) {
    var dots = Array.prototype.slice.call(rail.querySelectorAll("a"));
    var targets = dots
      .map(function (a) {
        var id = a.getAttribute("href").slice(1);
        return document.getElementById(id);
      })
      .filter(Boolean);

    if ("IntersectionObserver" in window && targets.length) {
      var spy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              var i = targets.indexOf(e.target);
              dots.forEach(function (d, j) { d.classList.toggle("on", i === j); });
            }
          });
        },
        { rootMargin: "-45% 0px -45% 0px" }
      );
      targets.forEach(function (t) { spy.observe(t); });
    }
  }

  /* ---------- grafiek: paden opmeten zodat ze zich correct intekenen ---------- */
  document.querySelectorAll(".draw").forEach(function (p) {
    try {
      var len = p.getTotalLength();
      p.style.setProperty("--len", len);
    } catch (e) {
      /* SVG niet meetbaar (bv. in een verborgen tab): laat de animatie vervallen */
      p.style.strokeDasharray = "none";
      p.style.strokeDashoffset = "0";
    }
  });

  /* ---------- telefoon-tabs op de frontend-pagina ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var btns = group.querySelectorAll("[data-tab]");
    var panes = group.querySelectorAll("[data-pane]");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-tab");
        btns.forEach(function (x) { x.classList.toggle("on", x === b); });
        panes.forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== id; });
      });
    });
  });
})();
