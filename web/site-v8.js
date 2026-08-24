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

      // The performance rail turns the four-part performance structure into a
      // calm infinite slider. It pauses on intent, supports keyboard controls,
      // and loops through cloned edge cards without a visible jump.
      const structureSlider = document.querySelector("[data-structure-slider]");
      if (structureSlider) {
        const viewport = structureSlider.querySelector("[data-structure-viewport]");
        const track = structureSlider.querySelector("[data-structure-track]");
        const slides = [...structureSlider.querySelectorAll("[data-structure-slide]")];
        const nextButton = structureSlider.querySelector("[data-structure-next]");
        const prevButton = structureSlider.querySelector("[data-structure-prev]");
        const pauseButton = structureSlider.querySelector("[data-structure-pause]");
        const indexNode = structureSlider.querySelector("[data-structure-index]");
        const progress = structureSlider.querySelector("[data-structure-progress]");

        if (viewport && track && slides.length > 1) {
          const firstClone = slides[0].cloneNode(true);
          const lastClone = slides[slides.length - 1].cloneNode(true);
          firstClone.dataset.clone = "true";
          lastClone.dataset.clone = "true";
          firstClone.setAttribute("aria-hidden", "true");
          lastClone.setAttribute("aria-hidden", "true");
          track.insertBefore(lastClone, track.firstChild);
          track.appendChild(firstClone);

          let cursor = 1;
          let step = 0;
          let tween = null;
          let autoCall = null;
          let progressTween = null;
          let paused = false;
          let inView = false;

          const measure = () => {
            step = slides[0].getBoundingClientRect().height;
            return step;
          };
          const currentIndex = () => (cursor - 1 + slides.length) % slides.length;
          const setActive = () => {
            const activeIndex = currentIndex();
            slides.forEach((slide, index) => {
              const active = index === activeIndex;
              slide.classList.toggle("is-current", active);
              slide.setAttribute("aria-current", active ? "step" : "false");
            });
            if (indexNode) indexNode.textContent = String(activeIndex + 1).padStart(2, "0");
          };
          const stopProgress = () => {
            progressTween?.kill();
            progressTween = null;
            if (progress) gsap.set(progress, { scaleX: 0 });
          };
          const startProgress = () => {
            stopProgress();
            if (!progress || paused || !inView) return;
            progressTween = gsap.to(progress, { scaleX: 1, duration: 4.6, ease: "none" });
          };
          const schedule = () => {
            autoCall?.kill();
            autoCall = null;
            if (paused || !inView) return;
            autoCall = gsap.delayedCall(4.6, () => move(1));
          };
          const normalizeEdge = () => {
            if (cursor === 0) cursor = slides.length;
            if (cursor === slides.length + 1) cursor = 1;
            measure();
            gsap.set(track, { y: -cursor * step });
          };
          const move = direction => {
            if (tween?.isActive()) return;
            measure();
            cursor += direction;
            setActive();
            stopProgress();
            if (!motion) {
              normalizeEdge();
              return;
            }
            tween = gsap.to(track, {
              y: -cursor * step,
              duration: .95,
              ease: "power3.inOut",
              overwrite: true,
              onComplete: () => {
                normalizeEdge();
                tween = null;
                setActive();
                startProgress();
                schedule();
              }
            });
            startProgress();
          };
          const hold = () => {
            if (paused) return;
            autoCall?.kill();
            autoCall = null;
            progressTween?.pause();
          };
          const resume = () => {
            if (paused) return;
            if (progressTween?.isActive()) progressTween.play();
            else startProgress();
            schedule();
          };

          measure();
          gsap.set(track, { y: -cursor * step });
          setActive();

          listen(nextButton, "click", () => move(1));
          listen(prevButton, "click", () => move(-1));
          listen(pauseButton, "click", () => {
            paused = !paused;
            pauseButton.setAttribute("aria-pressed", String(paused));
            pauseButton.textContent = paused ? "继续" : "暂停";
            if (paused) {
              autoCall?.kill();
              autoCall = null;
              progressTween?.kill();
              progressTween = null;
            } else {
              startProgress();
              schedule();
            }
          });
          listen(structureSlider, "pointerenter", hold);
          listen(structureSlider, "pointerleave", resume);
          listen(structureSlider, "focusin", hold);
          listen(structureSlider, "focusout", event => {
            if (!structureSlider.contains(event.relatedTarget)) resume();
          });
          listen(structureSlider, "keydown", event => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            move(event.key === "ArrowDown" ? 1 : -1);
          });

          const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
            measure();
            gsap.set(track, { y: -cursor * step });
          }) : null;
          resizeObserver?.observe(viewport);
          cleanup.push(() => resizeObserver?.disconnect());
          cleanup.push(() => { firstClone.remove(); lastClone.remove(); });
          cleanup.push(() => { autoCall?.kill(); progressTween?.kill(); tween?.kill(); });

          const visibility = ScrollTrigger.create({
            trigger: structureSlider,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => { inView = true; startProgress(); schedule(); },
            onEnterBack: () => { inView = true; startProgress(); schedule(); },
            onLeave: () => { inView = false; autoCall?.kill(); progressTween?.kill(); tween?.kill(); },
            onLeaveBack: () => { inView = false; autoCall?.kill(); progressTween?.kill(); tween?.kill(); }
          });
          cleanup.push(() => visibility.kill());
          window.requestAnimationFrame(() => {
            const rect = structureSlider.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              inView = true;
              startProgress();
              schedule();
            }
          });
        }
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

/* V8.3 · provenance text director
   Split only the visual layer: the source copy stays in the DOM, while GSAP
   reveals values, descriptions and the archive cue in reading order. */
(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.querySelector('.provenance-strip');
  if (!root || root.dataset.provenanceMotionReady === 'true') return;
  root.dataset.provenanceMotionReady = 'true';
  gsap.registerPlugin(ScrollTrigger);

  const tokenGroups = [];
  const splitText = (element, chars) => {
    if (!element || element.dataset.provenanceSplit === 'true') return [];
    const text = element.textContent.trim();
    if (!text) return [];
    element.dataset.provenanceSplit = 'true';
    element.setAttribute('aria-label', text);
    const parts = chars ? Array.from(text) : [text];
    const fragment = document.createDocumentFragment();
    const tokens = [];
    parts.forEach(part => {
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }
      const token = document.createElement('span');
      token.className = 'provenance-token';
      token.textContent = part;
      token.setAttribute('aria-hidden', 'true');
      fragment.append(token);
      tokens.push(token);
    });
    element.replaceChildren(fragment);
    tokenGroups.push(tokens);
    return tokens;
  };

  const headlineTokens = [...root.querySelectorAll('dt')].flatMap(el => splitText(el, false));
  const detailTokens = [...root.querySelectorAll('dd')].flatMap(el => splitText(el, true));
  const noteTokens = [...root.querySelectorAll(':scope > p')].flatMap(el => splitText(el, true));
  const cueTokens = [...root.querySelectorAll('.provenance-annotation > span, .provenance-annotation > b')]
    .flatMap(el => splitText(el, true));
  const allTokens = [...headlineTokens, ...detailTokens, ...noteTokens, ...cueTokens];
  if (!allTokens.length) return;

  gsap.set(allTokens, { autoAlpha: 0 });
  const timeline = gsap.timeline({ paused: true });
  timeline
    .fromTo(headlineTokens,
      { yPercent: 115, rotateX: -18, autoAlpha: 0 },
      { yPercent: 0, rotateX: 0, autoAlpha: 1, duration: .78, ease: 'power4.out', stagger: { each: .1, from: 'start' } }, 0)
    .fromTo(detailTokens,
      { y: 12, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: .38, ease: 'power3.out', stagger: { each: .026, from: 'start' } }, .28)
    .fromTo(noteTokens,
      { y: 10, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: .42, ease: 'power3.out', stagger: .018 }, .56)
    .fromTo(cueTokens,
      { x: 12, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: .5, ease: 'power3.out', stagger: .018 }, .68);

  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top 82%',
    once: true,
    onEnter: () => timeline.play(0)
  });

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  window.addEventListener('pagehide', () => { trigger.kill(); timeline.kill(); }, { once: true });
})();
