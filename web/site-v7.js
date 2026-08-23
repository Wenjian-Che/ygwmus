/* V7 · focused interaction layer
   Apply the official GSAP patterns: timelines for sequence, quickSetter for
   per-scroll writes, matchMedia for reduced-motion, and explicit cleanup. */
(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const railFill = document.querySelector(".chapter-rail-line i");
  if (railFill) {
    gsap.set(railFill, { transformOrigin: "top center", scaleY: 0 });
    const setRailScale = gsap.quickSetter(railFill, "scaleY");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      invalidateOnRefresh: true,
      onUpdate: self => setRailScale(self.progress)
    });
  }

  const refreshAfterLayout = () => ScrollTrigger.refresh();
  if (document.readyState === "complete") refreshAfterLayout();
  else window.addEventListener("load", refreshAfterLayout, { once: true });

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const impact = document.querySelector(".impact-visual");
    const impactTrigger = document.querySelector("[data-impact-trigger]");
    let impactTimeline;
    const cleanup = [];

    const addEntrance = (targets, from, to, trigger, options = {}) => {
      const nodes = typeof targets === "string" ? document.querySelectorAll(targets) : targets;
      if (!nodes?.length) return null;
      const animation = gsap.fromTo(nodes, from, {
        ...to,
        scrollTrigger: {
          trigger,
          start: options.start || "top 76%",
          once: true,
          invalidateOnRefresh: true
        }
      });
      return animation;
    };

    // Editorial entrances: each module arrives as a small sequence rather than
    // one large block. The hierarchy stays readable even when the page is
    // scrolled quickly, and all motion remains transform/opacity based.
    addEntrance(
      ".rhythm-copy > *",
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: .72, stagger: .1, ease: "power4.out" },
      ".rhythm-section",
      { start: "top 72%" }
    );
    addEntrance(
      ".rhythm-section .big-drum",
      { y: 38, scale: .84, rotate: -5, opacity: 0 },
      { y: 0, scale: 1, rotate: 0, opacity: 1, duration: 1.05, ease: "expo.out" },
      ".rhythm-section",
      { start: "top 68%" }
    );
    addEntrance(
      ".beat-sequencer",
      { y: 38, opacity: 0, clipPath: "inset(0 0 14% 0 round 0px)" },
      { y: 0, opacity: 1, clipPath: "inset(0 0 0% 0 round 0px)", duration: 1, ease: "power3.out" },
      ".rhythm-section",
      { start: "top 60%" }
    );

    const rhythmWord = document.querySelector(".rhythm-word");
    if (rhythmWord) {
      gsap.to(rhythmWord, {
        yPercent: -13,
        xPercent: -3,
        ease: "none",
        scrollTrigger: { trigger: ".rhythm-section", start: "top bottom", end: "bottom top", scrub: .8 }
      });
    }

    addEntrance(
      ".roles-intro > *",
      { x: -34, opacity: 0 },
      { x: 0, opacity: 1, duration: .78, stagger: .1, ease: "power3.out" },
      ".roles-section",
      { start: "top 74%" }
    );
    addEntrance(
      ".role-ledger > button",
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: .7, stagger: .1, ease: "power4.out" },
      ".roles-section",
      { start: "top 70%" }
    );
    addEntrance(
      ".role-rule",
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: .75, ease: "power3.out" },
      ".roles-section",
      { start: "top 58%" }
    );

    addEntrance(
      ".facts-heading > *",
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: .8, stagger: .12, ease: "power4.out" },
      ".facts-section",
      { start: "top 74%" }
    );
    addEntrance(
      ".myth-list details",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: .62, stagger: .08, ease: "power3.out" },
      ".facts-section",
      { start: "top 61%" }
    );
    addEntrance(
      ".evidence-ladder",
      { x: 28, opacity: 0 },
      { x: 0, opacity: 1, duration: .86, ease: "power3.out" },
      ".facts-section",
      { start: "top 58%" }
    );

    addEntrance(
      ".agent-banner > *",
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: .9, stagger: .13, ease: "expo.out" },
      ".agent-banner",
      { start: "top 78%" }
    );

    // The final CTA and mascot breathe only while the invitation is on screen.
    // This keeps the page lively without running an offscreen infinite tween.
    const agentBanner = document.querySelector(".agent-banner");
    const agentMascot = document.querySelector(".agent-mascot-small");
    const agentCta = document.querySelector(".agent-cta");
    const ambient = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
    if (agentMascot) ambient.to(agentMascot, { y: -6, rotate: .65, duration: 2.8 }, 0);
    if (agentCta) ambient.to(agentCta, { y: -4, rotate: 1.5, duration: 2.4 }, 0);
    if (agentBanner && (agentMascot || agentCta)) {
      ScrollTrigger.create({
        trigger: agentBanner,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => ambient.play(),
        onEnterBack: () => ambient.play(),
        onLeave: () => ambient.pause(),
        onLeaveBack: () => ambient.pause()
      });
      cleanup.push(() => ambient.kill());
    }

    // Details are native disclosure controls; animate only the revealed copy
    // after the browser has toggled it, so keyboard and screen-reader behavior
    // remain native.
    document.querySelectorAll(".myth-list details").forEach(details => {
      const handleToggle = () => {
        if (!details.open) return;
        const body = details.querySelector(":scope > div");
        if (!body) return;
        gsap.fromTo(body,
          { y: -10, opacity: 0, clipPath: "inset(0 0 18% 0)" },
          { y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)", duration: .52, ease: "power3.out", clearProps: "clipPath" }
        );
      };
      details.addEventListener("toggle", handleToggle);
      cleanup.push(() => details.removeEventListener("toggle", handleToggle));
    });

    // Tempo changes receive a restrained acknowledgement, independent of the
    // audio/sequence logic in app.js.
    document.querySelectorAll(".tempo-tabs button").forEach(button => {
      const handleTempo = () => gsap.fromTo(button, { y: 3, scale: .97 }, { y: 0, scale: 1, duration: .42, ease: "back.out(2)" });
      button.addEventListener("click", handleTempo);
      cleanup.push(() => button.removeEventListener("click", handleTempo));
    });

    if (impact && impactTrigger) {
      const handleImpact = () => {
        impactTimeline?.kill();
        impactTimeline = gsap.timeline({ defaults: { ease: "power2.out" } })
          .set(impact, { "--impact-flash": 0 })
          .to(impact, { "--impact-flash": 1, duration: .12 })
          .to(impact, { "--impact-flash": 0, duration: .42, ease: "power3.out" });
      };
      impactTrigger.addEventListener("click", handleImpact);
      cleanup.push(() => impactTrigger.removeEventListener("click", handleImpact));
    }

    const rippleTargets = document.querySelectorAll(".impact-trigger, .primary-action, .outline-action, .nav-agent, .agent-cta");
    rippleTargets.forEach(button => {
      const handlePointerDown = event => {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "motion-ripple";
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.appendChild(ripple);
        gsap.fromTo(ripple,
          { scale: 0, autoAlpha: .55 },
          {
            scale: Math.max(rect.width, rect.height) / 7,
            autoAlpha: 0,
            duration: .55,
            ease: "power2.out",
            onComplete: () => ripple.remove()
          }
        );
      };
      button.addEventListener("pointerdown", handlePointerDown, { passive: true });
      cleanup.push(() => button.removeEventListener("pointerdown", handlePointerDown));
    });

    return () => {
      cleanup.forEach(remove => remove());
      impactTimeline?.kill();
    };
  });
})();
