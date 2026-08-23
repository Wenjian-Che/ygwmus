(() => {
  const stage = document.querySelector("[data-collection-stage]");
  if (stage) {
    const panels = [...stage.querySelectorAll(".collection-panel")];
    const activate = panel => panels.forEach(item => item.classList.toggle("is-active", item === panel));

    panels.forEach(panel => {
      panel.addEventListener("pointerenter", () => activate(panel));
      panel.addEventListener("focus", () => activate(panel));
      panel.addEventListener("pointermove", event => {
        const rect = panel.getBoundingClientRect();
        panel.style.setProperty("--panel-x", ((event.clientX - rect.left) / rect.width - .5).toFixed(3));
        panel.style.setProperty("--panel-y", ((event.clientY - rect.top) / rect.height - .5).toFixed(3));
      }, { passive: true });
      panel.addEventListener("pointerleave", () => {
        panel.style.setProperty("--panel-x", 0);
        panel.style.setProperty("--panel-y", 0);
      }, { passive: true });
    });
  }

  const formationStage = document.querySelector(".formation-cinema-image");
  if (formationStage) {
    formationStage.dataset.formationState = "double-columns";
    document.querySelectorAll("[data-formation]").forEach(button => {
      button.addEventListener("click", () => {
        formationStage.dataset.formationState = button.dataset.formation;
      });
    });
  }

  const archive = document.querySelector("[data-archive-shell]");
  if (archive) {
    const tabs = [...archive.querySelectorAll("[data-archive-tab]")];
    const panels = [...archive.querySelectorAll("[data-archive-panel]")];
    const selectArchive = key => {
      archive.dataset.activeArchive = key;
      tabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.archiveTab === key));
      panels.forEach(panel => {
        const active = panel.dataset.archivePanel === key;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });
    };
    tabs.forEach(tab => tab.addEventListener("click", () => selectArchive(tab.dataset.archiveTab)));

    archive.addEventListener("pointermove", event => {
      const rect = archive.getBoundingClientRect();
      archive.style.setProperty("--archive-x", ((event.clientX - rect.left) / rect.width - .5).toFixed(3));
      archive.style.setProperty("--archive-y", ((event.clientY - rect.top) / rect.height - .5).toFixed(3));
    }, { passive: true });
    archive.addEventListener("pointerleave", () => {
      archive.style.setProperty("--archive-x", 0);
      archive.style.setProperty("--archive-y", 0);
    }, { passive: true });
  }

  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const chapterLinks = [...document.querySelectorAll("[data-chapter-link]")];
  if (chapters.length && "IntersectionObserver" in window) {
    const activateChapter = key => chapterLinks.forEach(link => link.classList.toggle("is-active", link.dataset.chapterLink === key));
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activateChapter(visible.target.dataset.chapter);
    }, { rootMargin: "-25% 0px -55%", threshold: [0, .08, .2, .4] });
    chapters.forEach(chapter => observer.observe(chapter));
  }
  const characterDialog = document.querySelector("[data-character-dialog]");
  if (characterDialog) {
    const dialogImage = characterDialog.querySelector("[data-character-dialog-image]");
    const dialogName = characterDialog.querySelector("[data-character-dialog-name]");
    const dialogCode = characterDialog.querySelector("[data-character-dialog-code]");
    const dialogMeta = characterDialog.querySelector("[data-character-dialog-meta]");
    const dialogNote = characterDialog.querySelector("[data-character-dialog-note]");
    document.querySelectorAll("[data-character-record]").forEach(record => {
      record.addEventListener("click", () => {
        dialogImage.src = record.dataset.characterSrc;
        dialogImage.alt = `${record.dataset.characterName}角色三视图大图`;
        dialogName.textContent = record.dataset.characterName;
        dialogCode.textContent = record.dataset.characterCode;
        dialogMeta.textContent = record.dataset.characterMeta;
        dialogNote.textContent = record.dataset.characterNote;
        characterDialog.showModal();
      });
    });
    characterDialog.querySelector("[data-character-dialog-close]")?.addEventListener("click", () => characterDialog.close());
    characterDialog.addEventListener("click", event => {
      if (event.target === characterDialog) characterDialog.close();
    });
  }

  const motionScore = document.querySelector("[data-motion-score]");
  let setMotionPhase = null;
  if (motionScore) {
    const motionSection = motionScore.closest(".motion-score");
    const motionSteps = [...motionScore.querySelectorAll("[data-motion-step]")];
    const motionKicker = motionScore.querySelector("[data-motion-kicker]");
    const motionTitle = motionScore.querySelector("[data-motion-title]");
    const motionDescription = motionScore.querySelector("[data-motion-description]");
    const phaseKeys = motionSteps.map(step => step.dataset.motionStep);
    const phaseCopy = {
      support: {
        kicker: "支撑",
        title: "先看脚底，不先看槌",
        description: "稳定来自站距、朝向与落脚支撑。肩颈如果先耸起，手臂往往会抢在身体之前发力。"
      },
      shift: {
        kicker: "移重",
        title: "重心先动，槌端后到",
        description: "屈髋屈膝、转体或移重心先改变身体条件，槌端随后才获得速度。低重心不是越低越好，而是要保持可转动、可呼吸。"
      },
      transfer: {
        kicker: "传递",
        title: "力量穿过躯干",
        description: "下肢与躯干把力量送向肩、肘、腕和槌端。若身体各段各自甩动，看起来幅度很大，也难形成稳定落点。"
      },
      recover: {
        kicker: "收力",
        title: "收得住，才接得上",
        description: "接触或轨迹顶点之后要减速、回收，避免槌端继续失控穿出，并回到下一动作可用的位置。"
      }
    };
    let currentMotionPhase = "support";
    setMotionPhase = (key, animate = true) => {
      if (!phaseCopy[key]) return;
      const changed = key !== currentMotionPhase;
      currentMotionPhase = key;
      motionScore.dataset.motionPhase = key;
      motionSteps.forEach(step => {
        const active = step.dataset.motionStep === key;
        step.classList.toggle("is-active", active);
        step.querySelector("button")?.setAttribute("aria-pressed", String(active));
      });
      if (!changed && motionTitle.textContent === phaseCopy[key].title) return;
      motionKicker.textContent = phaseCopy[key].kicker;
      motionTitle.textContent = phaseCopy[key].title;
      motionDescription.textContent = phaseCopy[key].description;
      if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        [motionKicker, motionTitle, motionDescription].forEach((element, index) => {
          element.animate(
            [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 460 + index * 90, delay: index * 45, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }
          );
        });
      }
    };
    motionSteps.forEach((step, index) => {
      step.querySelector("button")?.addEventListener("click", () => {
        setMotionPhase(step.dataset.motionStep);
        if (innerWidth > 720 && motionSection) {
          const span = motionSection.offsetHeight - innerHeight;
          scrollTo({ top: motionSection.offsetTop + span * (index / Math.max(1, phaseKeys.length - 1)), behavior: "smooth" });
        }
      });
    });
    setMotionPhase("support", false);
  }

  if (window.gsap && window.ScrollTrigger && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(".living-archive .archive-head > *",
      { y: 54, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.05, stagger: .13, ease: "power3.out", scrollTrigger: { trigger: ".living-archive", start: "top 68%", once: true } }
    );
    gsap.fromTo(".living-archive .archive-shell",
      { clipPath: "inset(0 0 100% 0 round 28px)", y: 34 },
      { clipPath: "inset(0 0 0% 0 round 28px)", y: 0, duration: 1.35, ease: "expo.out", scrollTrigger: { trigger: ".archive-shell", start: "top 83%", once: true } }
    );
    ScrollTrigger.create({
      trigger: ".living-archive", start: "top bottom", end: "bottom top", scrub: .8,
      onUpdate: self => document.documentElement.style.setProperty("--archive-chapter-progress", self.progress.toFixed(3))
    });

    if (motionScore && setMotionPhase) {
      const motionSection = motionScore.closest(".motion-score");
      const motionKeys = [...motionScore.querySelectorAll("[data-motion-step]")].map(step => step.dataset.motionStep);
      ScrollTrigger.create({
        trigger: motionSection,
        start: "top top",
        end: "bottom bottom",
        scrub: .45,
        onUpdate: self => {
          const index = Math.min(motionKeys.length - 1, Math.floor(self.progress * motionKeys.length));
          setMotionPhase(motionKeys[index]);
          motionScore.style.setProperty("--motion-score-progress", self.progress.toFixed(3));
        }
      });
    }

    const atlas = document.querySelector(".atlas-film");
    if (atlas) {
      const atlasStage = atlas.querySelector(".atlas-film-stage");
      const atlasScenes = [...atlas.querySelectorAll("[data-atlas-scene]")];
      const atlasNav = [...atlas.querySelectorAll("[data-atlas-nav]")];
      const atlasCurrent = atlas.querySelector("[data-atlas-current]");
      const atlasProgress = atlas.querySelector("[data-atlas-progress]");
      const atlasVideos = [...atlas.querySelectorAll("[data-atlas-video]")];
      let atlasIndex = 0;
      const setAtlasScene = (index, scrollToScene = false) => {
        const next = Math.max(0, Math.min(atlasScenes.length - 1, index));
        if (next !== atlasIndex || !atlasScenes[next].classList.contains("is-active")) {
          atlasScenes.forEach((scene, sceneIndex) => {
            const active = sceneIndex === next;
            scene.classList.toggle("is-active", active);
            scene.setAttribute("aria-hidden", String(!active));
          });
          atlasNav.forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === next));
          atlasVideos.forEach(video => {
            const active = video.closest("[data-atlas-scene]") === atlasScenes[next];
            if (active) video.play().catch(() => {}); else video.pause();
          });
          atlasCurrent.textContent = String(next + 1).padStart(2, "0");
          atlasIndex = next;
        }
        if (scrollToScene) {
          const top = atlas.offsetTop + (atlas.offsetHeight - innerHeight) * (next / (atlasScenes.length - 1));
          scrollTo({ top, behavior: "smooth" });
        }
      };
      atlasNav.forEach((button, index) => button.addEventListener("click", () => setAtlasScene(index, true)));
      ScrollTrigger.create({
        trigger: atlas,
        start: "top top",
        end: "bottom bottom",
        scrub: .35,
        onUpdate: self => {
          const segment = Math.min(atlasScenes.length - 1, Math.floor(self.progress * atlasScenes.length));
          setAtlasScene(segment);
          atlasStage.classList.toggle("is-progressing", self.progress > .06);
          atlasProgress.style.transform = `scaleX(${self.progress})`;
          const local = (self.progress * atlasScenes.length) % 1;
          const image = atlasScenes[segment]?.querySelector("img");
          if (image) image.style.transform = `scale(${1.015 + local * .035}) translate3d(${(local - .5) * -1.2}%,${(local - .5) * -.8}%,0)`;
        }
      });
    }
  }
})();
