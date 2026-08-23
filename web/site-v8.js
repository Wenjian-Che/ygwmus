/* V8 · GSAP motion direction
   A small, independent motion layer built from the official GSAP patterns:
   timelines for scene choreography, ScrollTrigger for scroll-led reveals,
   quickTo for pointer interactions, and matchMedia for responsive cleanup. */
(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add(
    {
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 901px)",
      finePointer: "(pointer: fine)"
    },
    ({ conditions }) => {
      const { motion, desktop, finePointer } = conditions;
      if (!motion) return () => {};

      const cleanup = [];
      const listen = (element, event, handler, options) => {
        if (!element) return;
        element.addEventListener(event, handler, options);
        cleanup.push(() => element.removeEventListener(event, handler, options));
      };

      // The atlas is the visual spine of the page. Its existing ScrollTrigger
      // swaps the active scene; this director gives every swap a single,
      // readable timeline instead of several independent fades.
      const atlas = document.querySelector(".atlas-film");
      if (atlas) {
        const scenes = [...atlas.querySelectorAll("[data-atlas-scene]")];
        let activeScene = null;
        let sceneTimeline = null;

        const playScene = scene => {
          if (!scene || scene === activeScene) return;
          activeScene = scene;
          sceneTimeline?.kill();

          const copy = scene.querySelector(".atlas-film-copy");
          const notes = scene.querySelectorAll(".atlas-note");
          const caption = scene.querySelector(".atlas-film-caption");
          const media = scene.querySelector(".atlas-film-image img, .atlas-film-image video");
          const mediaTargets = [media, copy, caption, ...notes].filter(Boolean);

          gsap.killTweensOf(mediaTargets);
          sceneTimeline = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => { sceneTimeline = null; }
          });

          if (media) {
            sceneTimeline.fromTo(media,
              { scale: 1.065, xPercent: 1.1 },
              { scale: 1.015, xPercent: 0, duration: 1.3, ease: "expo.out" },
              0
            );
          }
          if (copy) {
            sceneTimeline.fromTo(copy,
              { y: 34, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: .72, ease: "expo.out" },
              .08
            );
            sceneTimeline.fromTo(copy.querySelectorAll("span, h3, p"),
              { y: 16, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: .56, stagger: .07, ease: "power3.out" },
              .22
            );
          }
          if (notes.length) {
            sceneTimeline.fromTo(notes,
              { y: 14, scale: .94, autoAlpha: 0 },
              { y: 0, scale: 1, autoAlpha: 1, duration: .52, stagger: .08, ease: "back.out(1.25)" },
              .3
            );
          }
          if (caption) {
            sceneTimeline.fromTo(caption,
              { y: 9, autoAlpha: 0 },
              { y: 0, autoAlpha: .82, duration: .5, ease: "power2.out" },
              .44
            );
          }
        };

        const inspectScene = () => {
          playScene(scenes.find(scene => scene.classList.contains("is-active")));
        };
        const observer = new MutationObserver(inspectScene);
        observer.observe(atlas, { subtree: true, attributes: true, attributeFilter: ["class"] });
        cleanup.push(() => observer.disconnect());
        window.requestAnimationFrame(inspectScene);

        // A small focus pulse makes the chapter control feel connected to the
        // scene it controls, without moving the whole navigation rail.
        atlas.querySelectorAll("[data-atlas-nav]").forEach(button => {
          listen(button, "pointerdown", () => {
            gsap.fromTo(button,
              { scale: .96 },
              { scale: 1, duration: .42, ease: "back.out(2)", overwrite: true }
            );
          });
        });
      }

      // Formation descriptions are updated by the Three.js scene. Animate the
      // text after that state change so a long description never flashes or
      // collides with the stage controls.
      const formationStage = document.querySelector(".formation-cinema-image");
      const formationName = document.querySelector("#formation-name");
      const formationDescription = document.querySelector("#formation-description");
      if (formationStage && formationName && formationDescription) {
        const formationTimeline = { current: null };
        const animateFormationCopy = () => {
          const key = `${formationName.textContent}|${formationDescription.textContent}`;
          if (key === formationTimeline.current) return;
          formationTimeline.current = key;
          const targets = [formationName, formationDescription];
          gsap.killTweensOf(targets);
          gsap.timeline({ defaults: { ease: "power3.out" } })
            .fromTo(targets,
              { y: 10, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: .5, stagger: .06 },
              0
            )
            .fromTo(formationStage,
              { "--formation-flare": 0 },
              { "--formation-flare": 1, duration: .16, ease: "power2.out" },
              0
            )
            .to(formationStage,
              { "--formation-flare": 0, duration: .62, ease: "power3.out" },
              ".16"
            );
        };
        const copyObserver = new MutationObserver(() => window.requestAnimationFrame(animateFormationCopy));
        copyObserver.observe(formationName, { childList: true, characterData: true, subtree: true });
        copyObserver.observe(formationDescription, { childList: true, characterData: true, subtree: true });
        cleanup.push(() => copyObserver.disconnect());
        document.querySelectorAll("[data-formation]").forEach(button => {
          listen(button, "pointerdown", () => {
            gsap.to(formationStage, { rotationX: 0, rotationY: desktop ? -1.4 : 0, duration: .34, ease: "power2.out", overwrite: true });
          });
        });
        window.requestAnimationFrame(animateFormationCopy);
      }

      // Character cards lead with a single readable pose. On hover or focus,
      // the same card opens its complete turnaround as a calm, secondary
      // layer; the existing click action still opens the full dossier dialog.
      const characterRecords = document.querySelectorAll("[data-character-record]");
      characterRecords.forEach(record => {
        const hero = record.querySelector("[data-character-card-hero]");
        const turnaround = record.querySelector("[data-character-card-turnaround]");
        const cue = record.querySelector(".character-view-cue");
        const plus = record.querySelector("figure > i");
        if (!hero || !turnaround) return;

        let previewTimeline;
        const setPreview = show => {
          previewTimeline?.kill();
          record.classList.toggle("is-preview", show);
          previewTimeline = gsap.timeline({ defaults: { ease: "power3.out" }, overwrite: true });
          if (show) {
            previewTimeline
              .to(hero, { autoAlpha: .16, scale: record.matches(":first-child") ? 1.02 : 1.08, duration: .42 }, 0)
              .fromTo(turnaround,
                { autoAlpha: 0, scale: 1.045 },
                { autoAlpha: 1, scale: 1, duration: .56, ease: "expo.out" },
                .03
              )
              .to(cue, { autoAlpha: 0, y: -5, duration: .24 }, 0)
              .to(plus, { autoAlpha: 0, scale: .86, duration: .24 }, 0);
          } else {
            previewTimeline
              .to(turnaround, { autoAlpha: 0, scale: 1.045, duration: .34 }, 0)
              .to(hero, { autoAlpha: 1, scale: record.matches(":first-child") ? 1.04 : 1.18, duration: .46 }, 0)
              .to(cue, { autoAlpha: .78, y: 0, duration: .34 }, .06)
              .to(plus, { autoAlpha: 1, scale: 1, duration: .34 }, .06);
          }
        };

        listen(record, "pointerenter", () => setPreview(true));
        listen(record, "pointerleave", () => setPreview(false));
        listen(record, "focusin", () => setPreview(true));
        listen(record, "focusout", event => {
          if (!event.relatedTarget || !record.contains(event.relatedTarget)) setPreview(false);
        });
      });

      // ScrollTrigger.batch keeps the long regional rail light: cards animate
      // as a group only when they enter view, rather than running off-screen.
      const journeyCards = document.querySelectorAll(".journey-card");
      if (journeyCards.length) {
        ScrollTrigger.batch(journeyCards, {
          start: "top 84%",
          once: true,
          interval: .08,
          batchMax: desktop ? 3 : 2,
          onEnter: elements => gsap.fromTo(elements,
            { y: 42, autoAlpha: 0, rotateX: desktop ? 3 : 0 },
            { y: 0, autoAlpha: 1, rotateX: 0, duration: .78, stagger: .1, ease: "expo.out", overwrite: true }
          )
        });
      }

      // A restrained pointer field gives primary actions a physical response.
      // quickTo reuses the same tween and avoids creating one tween per frame.
      if (finePointer) {
        const magneticTargets = document.querySelectorAll(".primary-action, .agent-cta, .nav-agent");
        magneticTargets.forEach(target => {
          const xTo = gsap.quickTo(target, "x", { duration: .36, ease: "power3.out" });
          const yTo = gsap.quickTo(target, "y", { duration: .36, ease: "power3.out" });
          const onMove = event => {
            const rect = target.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - .5;
            const y = (event.clientY - rect.top) / rect.height - .5;
            xTo(x * 7);
            yTo(y * 5);
          };
          const reset = () => { xTo(0); yTo(0); };
          listen(target, "pointermove", onMove, { passive: true });
          listen(target, "pointerleave", reset, { passive: true });
        });
      }

      // Keep the hero's decorative pulse alive only while it is visible.
      const hero = document.querySelector(".hero");
      const signal = hero?.querySelector(".hero-signal");
      if (hero && signal) {
        const signalTimeline = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "sine.inOut" } });
        signalTimeline.to(signal.querySelectorAll("span"), { scale: 1.35, autoAlpha: .25, duration: 1.5, stagger: .16 }, 0)
          .to(signal.querySelectorAll("span"), { scale: 1, autoAlpha: .75, duration: 1.5, stagger: .16 }, ".45");
        ScrollTrigger.create({
          trigger: hero,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => signalTimeline.play(),
          onEnterBack: () => signalTimeline.play(),
          onLeave: () => signalTimeline.pause(),
          onLeaveBack: () => signalTimeline.pause()
        });
        cleanup.push(() => signalTimeline.kill());
      }

      // Any new image/font layout that affects a trigger gets one refresh after
      // the browser has painted it; no resize loop is introduced.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });
      cleanup.push(() => window.removeEventListener("load", refresh));

      return () => cleanup.forEach(remove => remove());
    }
  );
})();
