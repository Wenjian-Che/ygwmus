(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setBeat = (index) => document.querySelectorAll(".impact-beats li")
    .forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    setBeat(0);
    return;
  }

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  gsap.timeline({ defaults: { ease: "power4.out" } })
    .fromTo(".site-header", { y: -80 }, { y: 0, duration: .8 })
    .fromTo(".hero-copy > *", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .09 }, "-=.35")
    .fromTo(".mascot-stage", { y: 80, opacity: 0, scale: .92 }, { y: 0, opacity: 1, scale: 1, duration: 1.1 }, "-=.85");

  gsap.to(".hero-bg", {
    scale: 1.08,
    yPercent: 4,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
  });

  document.querySelectorAll(".impact-beats li").forEach((item, index) => {
    ScrollTrigger.create({
      trigger: item,
      start: "top 62%",
      end: "bottom 42%",
      onEnter: () => setBeat(index),
      onEnterBack: () => setBeat(index)
    });
  });

  gsap.fromTo(".impact-visual",
    { clipPath: "inset(10% 8% 10% 8% round 28px)" },
    {
      clipPath: "inset(0% 0% 0% 0% round 0px)",
      ease: "none",
      scrollTrigger: { trigger: ".impact-story", start: "top bottom", end: "center center", scrub: .8 }
    }
  );

  const hero = document.querySelector(".hero");
  const stage = document.querySelector(".mascot-stage");
  if (hero && stage && matchMedia("(pointer:fine)").matches) {
    const moveX = gsap.quickTo(stage, "x", { duration: .7, ease: "power3.out" });
    const moveY = gsap.quickTo(stage, "y", { duration: .7, ease: "power3.out" });
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      moveX(((event.clientX - rect.left) / rect.width - .5) * 22);
      moveY(((event.clientY - rect.top) / rect.height - .5) * 14);
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { moveX(0); moveY(0); });
  }
})();

(() => {
  const viewport = document.querySelector("#official-map-viewport");
  const mapButtons = [...document.querySelectorAll("[data-official-map-view]")];
  const setMapView = (view) => {
    if (!viewport) return;
    viewport.classList.toggle("is-guangdong", view === "guangdong");
    mapButtons.forEach((button) => button.classList.toggle("active", button.dataset.officialMapView === view));
  };
  mapButtons.forEach((button) => button.addEventListener("click", () => setMapView(button.dataset.officialMapView)));
  document.querySelector(".hotspot-chaoshan")?.addEventListener("click", () => setMapView("guangdong"));

  if (matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".feature-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }
})();
