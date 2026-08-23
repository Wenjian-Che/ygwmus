(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const progress = document.querySelector(".reading-progress i");
  const header = document.querySelector(".site-header");

  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      if (progress) progress.style.transform = `scaleX(${self.progress})`;
      header?.classList.toggle("is-condensed", self.scroll() > 70);
    }
  });

  if (reduced) return;

  // Story hierarchy: each entrance uses a different material and direction.
  gsap.fromTo(".provenance-strip dl > div",
    { y: 34, opacity: .2 },
    { y: 0, opacity: 1, duration: .85, stagger: .09, ease: "power4.out", scrollTrigger: { trigger: ".provenance-strip", start: "top 78%" } }
  );

  gsap.fromTo(".formation-cinema-copy",
    { clipPath: "inset(0 100% 0 0)" },
    { clipPath: "inset(0 0% 0 0)", duration: 1.15, ease: "expo.out", scrollTrigger: { trigger: ".formation-cinema", start: "top 72%" } }
  );

  gsap.fromTo(".formation-stage-meta",
    { x: -26, opacity: 0 },
    { x: 0, opacity: 1, duration: .9, ease: "power3.out", scrollTrigger: { trigger: ".formation-cinema", start: "top 65%" } }
  );

  gsap.utils.toArray(".impact-beats li").forEach((item, index) => {
    ScrollTrigger.create({
      trigger: item,
      start: "top 62%",
      onEnter: () => {
        document.querySelectorAll(".impact-beats li").forEach(beat => beat.classList.remove("is-active"));
        item.classList.add("is-active");
        gsap.fromTo(item, { x: -10 }, { x: 0, duration: .42, ease: "power3.out" });
      },
      onEnterBack: () => {
        document.querySelectorAll(".impact-beats li").forEach(beat => beat.classList.remove("is-active"));
        item.classList.add("is-active");
      }
    });
  });

  gsap.utils.toArray(".watch-track li").forEach((item, index) => {
    const direction = index % 2 ? 16 : -16;
    gsap.fromTo(item, { y: 38, opacity: .15, rotateY: direction }, {
      y: 0, opacity: 1, rotateY: 0, duration: .85, ease: "power4.out",
      scrollTrigger: { trigger: ".watch-track", start: "top 76%", once: true }
    });
  });

  gsap.fromTo(".feature-card",
    { y: 70, opacity: .45, clipPath: "inset(12% 0 0 0 round 14px)" },
    { y: 0, opacity: 1, clipPath: "inset(0% 0 0 0 round 14px)", duration: 1, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: ".feature-grid", start: "top 78%" } }
  );

  gsap.fromTo(".knowledge-side-note",
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: .75, ease: "power3.out", scrollTrigger: { trigger: ".know-section", start: "top 78%" } }
  );

  gsap.fromTo(".official-map-stage",
    { scale: .92, rotateX: 4, transformPerspective: 1200 },
    { scale: 1, rotateX: 0, duration: 1.25, ease: "expo.out", scrollTrigger: { trigger: ".region-section", start: "top 72%" } }
  );

  gsap.fromTo(".structure-flow article > span",
    { x: -24, opacity: .15 },
    { x: 0, opacity: 1, duration: .7, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".structure-flow", start: "top 78%" } }
  );

  gsap.fromTo(".timeline li",
    { y: 42, opacity: .3 },
    { y: 0, opacity: 1, duration: .8, stagger: .1, ease: "power4.out", scrollTrigger: { trigger: ".timeline", start: "top 80%" } }
  );

  gsap.fromTo(".hero-exhibition-art",
    { opacity: 0, scale: .86, rotate: 4, x: 60 },
    { opacity: 1, scale: 1, rotate: 0, x: 0, duration: 1.45, ease: "expo.out", delay: .16 }
  );

  const heroArt = document.querySelector(".hero-exhibition-art");
  if (heroArt) {
    // This is a stage cue, not a looping gimmick: the scene opens once, then follows the viewer subtly.
    requestAnimationFrame(() => heroArt.classList.add("is-cued"));
    if (matchMedia("(pointer:fine)").matches) {
      heroArt.addEventListener("pointermove", (event) => {
        const rect = heroArt.getBoundingClientRect();
        const dx = (event.clientX - rect.left) / rect.width - .5;
        const dy = (event.clientY - rect.top) / rect.height - .5;
        heroArt.style.setProperty("--art-x", `${dx * -16}px`);
        heroArt.style.setProperty("--art-y", `${dy * -12}px`);
      }, { passive: true });
      heroArt.addEventListener("pointerleave", () => {
        heroArt.style.setProperty("--art-x", "0px");
        heroArt.style.setProperty("--art-y", "0px");
      });
    }
  }

  const heroImage = document.querySelector(".hero-exhibition-art img");
  if (heroImage) {
    gsap.to(heroImage, {
      yPercent: 7,
      scale: 1.11,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .8 }
    });
    gsap.to(".hero-copy", {
      yPercent: -18,
      opacity: .12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "75% top", scrub: .65 }
    });
  }

  const impactAtmosphere = document.querySelector(".impact-atmosphere");
  if (impactAtmosphere) {
    gsap.fromTo(impactAtmosphere,
      { scale: 1.1, xPercent: -2 },
      { scale: 1.02, xPercent: 2, ease: "none", scrollTrigger: { trigger: ".impact-story", start: "top bottom", end: "bottom top", scrub: .8 } }
    );
  }

  gsap.fromTo(".manifesto-portrait",
    { opacity: 0, y: 64, rotate: 5, clipPath: "inset(10% 8% 10% 8% round 24%)" },
    { opacity: 1, y: 0, rotate: 0, clipPath: "inset(0% 0% 0% 0% round 24%)", duration: 1.25, ease: "expo.out", scrollTrigger: { trigger: ".manifesto", start: "top 72%" } }
  );

  document.querySelectorAll("[data-art-parallax]").forEach((figure) => {
    const image = figure.querySelector("img");
    if (!image) return;
    gsap.to(image, {
      yPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: figure, start: "top bottom", end: "bottom top", scrub: .7 }
    });
  });

  // Magnetic response is restrained to primary actions and communicates clickability.
  if (matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".primary-action, .nav-agent, .agent-cta").forEach((target) => {
      const xTo = gsap.quickTo(target, "x", { duration: .45, ease: "power3.out" });
      const yTo = gsap.quickTo(target, "y", { duration: .45, ease: "power3.out" });
      target.addEventListener("pointermove", (event) => {
        const rect = target.getBoundingClientRect();
        xTo((event.clientX - rect.left - rect.width / 2) * .12);
        yTo((event.clientY - rect.top - rect.height / 2) * .18);
      }, { passive: true });
      target.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }
})();
