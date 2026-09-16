(() => {
  const page = document.querySelector('.knowledge-page');
  if (!page || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = gsap.utils.toArray('.performance-chapter');
  const signals = gsap.utils.toArray('.performance-signal');
  const stageImage = document.querySelector('.performance-stage img');
  const pulse = document.querySelector('.performance-pulse');
  const subnavLinks = gsap.utils.toArray('.museum-subnav a');
  const sections = subnavLinks.map(link => document.querySelector(link.hash)).filter(Boolean);
  const treeNodes = gsap.utils.toArray('.knowledge-node');
  const treeReadout = document.querySelector('.knowledge-tree-readout');
  const treeReadoutTitle = document.querySelector('#treeReadoutTitle');
  const treeReadoutText = document.querySelector('#treeReadoutText');
  const treeAgentQuestion = document.querySelector('#treeAgentQuestion');
  const floatingCompanion = document.querySelector('.museum-companion');
  const tempoLab = document.querySelector('.tempo-lab');
  const tempoTabs = gsap.utils.toArray('.tempo-tab');
  const tempoVisual = document.querySelector('.tempo-visual');
  const tempoGlyph = document.querySelector('#tempoGlyph');
  const tempoCount = document.querySelector('#tempoCount');
  const tempoTitle = document.querySelector('#tempoTitle');
  const tempoText = document.querySelector('#tempoText');
  const tempoWatch = document.querySelector('#tempoWatch');
  const tempoAgentQuestion = document.querySelector('#tempoAgentQuestion');
  const caseTabs = gsap.utils.toArray('.case-tab');
  const caseStage = document.querySelector('.difference-case-stage');
  const caseImage = document.querySelector('#caseImage');
  const caseMeta = document.querySelector('#caseMeta');
  const caseTitle = document.querySelector('#caseTitle');
  const caseText = document.querySelector('#caseText');
  const caseSource = document.querySelector('#caseSource');
  const caseAgentQuestion = document.querySelector('#caseAgentQuestion');
  if (treeReadout && floatingCompanion && 'IntersectionObserver' in window) {
    const treeObserver = new IntersectionObserver(entries => {
      floatingCompanion.classList.toggle('is-knowledge-tree-visible', entries[0]?.isIntersecting === true);
    }, { threshold: .12 });
    treeObserver.observe(document.querySelector('.knowledge-tree'));
    window.addEventListener('pagehide', () => treeObserver.disconnect(), { once: true });
  }
  const treeCopy = {
    body: {
      title: '身体技艺',
      text: '英歌的力量先来自重心下沉和全身协调。脚下的移动、腰胯的转动、上身的开合与双槌路线共同完成一个动作，并不是只靠手臂挥槌。',
      textEn: 'Yingge’s force begins with a lowered centre of gravity and whole-body coordination. Footwork, hip rotation, torso movement, and paired-stick paths complete each action together.',
      question: '英歌的力量感为什么不是只靠手臂？'
    },
    sound: {
      title: '声音指挥',
      text: '锣鼓并非陪衬。鼓点提供速度、重音和段落信号，锣钹强化拍点，槌击与吆喝让声音和身体在现场互相回应。具体口令和节奏仍随板式、队伍而变。',
      textEn: 'Percussion is not accompaniment. Drumbeats set pace, accents, and section cues; gongs, cymbals, stick strikes, and calls connect sound with movement. Exact patterns vary by style and troupe.',
      question: '英歌的鼓点、锣钹、槌击和吆喝分别起什么作用？'
    },
    space: {
      title: '空间组织',
      text: '队形不是静止图案。队员通过分行、合拢、穿插、回旋和换位处理人与人之间的距离，使个人动作成为可以移动的集体结构。',
      textEn: 'A formation is not a static shape. Lines, joining, threading, circling, and position changes organise individual actions into a moving collective structure.',
      question: '英歌队形怎样从个人动作变成集体空间？'
    },
    role: {
      title: '人物装束',
      text: '脸谱和装束帮助建立人物形象，但颜色不能单独证明角色身份。判断人物还要结合队伍位置、表演职责、服装、器物和具体队伍资料。',
      textEn: 'Facial patterns and costume help shape a character, but colour alone cannot identify a role. Position, function, dress, objects, and troupe records must be considered together.',
      question: '为什么不能只靠脸谱颜色判断英歌角色？'
    },
    place: {
      title: '地方传承',
      text: '英歌在社区中依靠师承、训练和节庆实践延续。地区名称只是索引，真正的差异往往发生在具体村落、队伍、年代和传承关系中。',
      textEn: 'Yingge continues through teaching lineages, training, and festival practice. Place names are only an index; meaningful differences belong to particular villages, troupes, periods, and lineages.',
      question: '理解英歌的地方差异，为什么要具体到村落、队伍和年代？'
    },
    evidence: {
      title: '证据来源',
      text: '名录和标准用于确认项目身份与术语，队伍档案和影像说明具体做法，口述材料保存传承记忆。不同证据回答不同问题，不能混成同一等级的结论。',
      textEn: 'Registers and standards confirm project identity and terms; troupe records and footage document practices; oral accounts preserve transmission memories. Each source answers a different question.',
      question: '英歌研究中的名录、影像和口述材料分别能证明什么？'
    }
  };
  const tempoCopy = {
    slow: {
      glyph: '慢',
      count: '节拍之间留有停顿和延展',
      title: '慢中见势，动作有时间展开。',
      text: '潮阳英歌公开项目资料记载，慢板所用舞槌通常较长，基本舞法可由三下槌或四下槌组成一组动作。观看时可以留意重心怎样稳定下来，以及一次槌路如何完整走完。',
      watch: '停顿、重心与完整槌路',
      question: '潮阳慢板英歌为什么能在较慢的速度里保持力量感？'
    },
    medium: {
      glyph: '中',
      count: '鼓点更连续，动作衔接更紧',
      title: '稳健还在，动作开始圆活。',
      text: '中板比慢板更快，公开项目资料记录了五棒、七棒、八棒等不同动作组合。它不是一个固定速度，而是一组板式风格。观看时可以比较停顿是否减少，动作之间怎样连续衔接。',
      watch: '连续鼓点与动作衔接',
      question: '潮阳中板英歌常见的动作组合和锣鼓组织有什么特点？'
    },
    fast: {
      glyph: '快',
      count: '鼓点紧密，随阵势开合变化',
      title: '短槌更灵便，队形更快响应。',
      text: '快板的鼓点紧，使用的英歌槌通常较短。速度提升后，运槌、落步和队形开合要在更短时间内完成。观看时不要只追着手臂看，也要留意队伍怎样维持间距。',
      watch: '短槌、密集拍点与队形响应',
      question: '快板英歌速度很快，队员怎样保持间距和动作一致？'
    }
  };
  const caseCopy = {
    lingdong: {
      image: 'assets/motion-archive.png',
      alt: '用于说明慢板观察方法的概念示意，不是岭东队现场档案',
      meta: '潮阳文光 · 慢板个案',
      title: '岭东的“慢”，不是动作少。',
      text: '岭东英歌以慢板“醉槌”见长。公开队伍资料描述其步伐沉稳，动作在刚劲与舒展之间转换。这个个案说明，板式差异会落到步法、力道和整组动作的呼吸上。',
      source: 'https://www.stpt.edu.cn/yinggewu/2025/0328/c4695a41549/page.htm',
      question: '岭东慢板英歌的醉槌有什么观看特点？'
    },
    helong: {
      image: 'assets/strike.png',
      alt: '用于说明快板与旋槌观察方法的概念示意，不是河陇队现场档案',
      meta: '潮阳铜盂 · 快板个案',
      title: '河陇的快板，落在旋槌和跳步上。',
      text: '河陇英歌公开资料记录了竖槌、快板和手指旋槌等做法，并由舞蛇者指挥队伍变换阵容。地方风格会落在具体的槌法、步法和指挥方式上。',
      source: 'https://www.stpt.edu.cn/yinggewu/2025/0328/c4646a41573/page.htm',
      question: '河陇英歌的旋槌、跳步和舞蛇者怎样配合？'
    },
    longgang: {
      image: 'assets/objects-archive.png',
      alt: '用于说明服饰与器物变化的概念示意，不是龙港女子队现场档案',
      meta: '潮阳贵屿 · 2024 年重组个案',
      title: '传承也会在当代重新编排。',
      text: '龙港女子英歌队在 2024 年重组，以学生为主要队员，并围绕花木兰形象重新设计造型、鼓点和部分动作。这个个案适合用来理解一件事：传统不是静止模板，但每次变化都应说明由谁、在何时、基于什么做法完成。',
      source: 'https://www.stpt.edu.cn/yinggewu/2025/0306/c4655a41232/page.htm',
      question: '龙港女子英歌队怎样在传统动作基础上进行当代编排？'
    }
  };
  const motion = gsap.context(() => {
    const activateTreeNode = node => {
      const copy = treeCopy[node?.dataset.tree];
      if (!copy || !treeReadoutTitle || !treeReadoutText || !treeAgentQuestion) return;
      treeNodes.forEach(item => {
        const active = item === node;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const update = () => {
        window.__yinggeSetLocalizedText?.(treeReadoutTitle, copy.title);
        window.__yinggeSetLocalizedText?.(treeReadoutText, copy.text, copy.textEn);
        treeAgentQuestion.dataset.agentQuestion = copy.question;
      };
      update();
      if (!reducedMotion && treeReadout) gsap.fromTo(treeReadout, { autoAlpha: .42, y: 8 }, { autoAlpha: 1, y: 0, duration: .34, ease: 'power3.out', overwrite: true });
    };

    treeNodes.forEach(node => node.addEventListener('click', () => activateTreeNode(node)));

    const activateTempo = button => {
      const copy = tempoCopy[button?.dataset.tempo];
      if (!copy || !tempoLab) return;
      tempoTabs.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      tempoLab.dataset.tempoMode = button.dataset.tempo;
      window.__yinggeSetLocalizedText?.(tempoGlyph, copy.glyph);
      window.__yinggeSetLocalizedText?.(tempoCount, copy.count);
      window.__yinggeSetLocalizedText?.(tempoTitle, copy.title);
      window.__yinggeSetLocalizedText?.(tempoText, copy.text);
      window.__yinggeSetLocalizedText?.(tempoWatch, copy.watch);
      tempoAgentQuestion.dataset.agentQuestion = copy.question;
      if (!reducedMotion && tempoVisual) {
        gsap.fromTo(tempoVisual, { scale: .985 }, { scale: 1, duration: .62, ease: 'power3.out', overwrite: true });
        gsap.fromTo('#tempoGlyph', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .42, ease: 'power3.out', overwrite: true });
        gsap.fromTo('.tempo-readout > *', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, stagger: .035, duration: .32, ease: 'power2.out', overwrite: true });
      }
    };

    tempoTabs.forEach(button => button.addEventListener('click', () => activateTempo(button)));

    const writeCase = copy => {
      caseImage.src = copy.image;
      caseImage.alt = copy.alt;
      window.__yinggeSetLocalizedText?.(caseMeta, copy.meta);
      window.__yinggeSetLocalizedText?.(caseTitle, copy.title);
      window.__yinggeSetLocalizedText?.(caseText, copy.text);
      caseSource.href = copy.source;
      caseAgentQuestion.dataset.agentQuestion = copy.question;
    };

    const activateCase = button => {
      const copy = caseCopy[button?.dataset.case];
      if (!copy || !caseStage) return;
      caseTabs.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      writeCase(copy);
      if (!reducedMotion) gsap.fromTo(caseStage, { autoAlpha: .42, y: 8 }, { autoAlpha: 1, y: 0, duration: .48, ease: 'power3.out', overwrite: true });
    };

    caseTabs.forEach(button => button.addEventListener('click', () => activateCase(button)));

    const treeBranches = gsap.utils.toArray('.knowledge-branch');
    if (treeBranches.length) {
      treeBranches.forEach(branch => {
        const length = branch.getTotalLength();
        gsap.set(branch, { strokeDasharray: length, strokeDashoffset: reducedMotion ? 0 : length });
      });
      if (!reducedMotion) {
        const treeTimeline = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: '.knowledge-tree', start: 'top 72%', once: true }
        });
        treeTimeline
          .from('.knowledge-tree-root', { autoAlpha: 0, y: 20, duration: .5 })
          .to(treeBranches, { strokeDashoffset: 0, stagger: .1, duration: .82, ease: 'power2.inOut' }, '<.08')
          .from('.knowledge-tree-core', { autoAlpha: 0, scale: .82, duration: .55 }, '<.18')
          .from(treeNodes, { autoAlpha: 0, y: 18, scale: .94, stagger: .08, duration: .55 }, '<.05')
          .from(treeReadout, { autoAlpha: 0, y: 12, duration: .48 }, '<.12');
      }
    }

    const activateChapter = index => {
      chapters.forEach((chapter, chapterIndex) => chapter.classList.toggle('is-active', chapterIndex === index));
      signals.forEach((signal, signalIndex) => signal.classList.toggle('is-active', signalIndex === index));
      if (reducedMotion) return;
      gsap.to(stageImage, {
        scale: 1.02 + (index * .018),
        xPercent: index % 2 ? -1.5 : 1,
        yPercent: index > 1 ? -1 : 1,
        duration: .9,
        ease: 'power3.out',
        overwrite: true
      });
      gsap.to(pulse, {
        rotation: index * 32,
        scale: 1 + (index * .055),
        duration: .82,
        ease: 'power3.out',
        overwrite: true
      });
    };

    chapters.forEach((chapter, index) => {
      ScrollTrigger.create({
        trigger: chapter,
        start: 'top 56%',
        end: 'bottom 44%',
        onEnter: () => activateChapter(index),
        onEnterBack: () => activateChapter(index)
      });
    });

    sections.forEach(section => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 42%',
        end: 'bottom 42%',
        onToggle: self => {
          if (!self.isActive) return;
          subnavLinks.forEach(link => link.setAttribute('aria-current', String(link.hash === `#${section.id}`)));
        }
      });
    });

    if (!reducedMotion) {
      gsap.from('.origin-evidence article', {
        autoAlpha: 0,
        y: 30,
        stagger: .12,
        duration: .75,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.origin-evidence', start: 'top 76%', once: true }
      });
      gsap.from('.tempo-lab', {
        autoAlpha: 0,
        y: 36,
        duration: .82,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tempo-lab', start: 'top 78%', once: true }
      });
      gsap.from('.case-tab', {
        autoAlpha: 0,
        y: 20,
        stagger: .08,
        duration: .58,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.difference-cases', start: 'top 78%', once: true }
      });
      gsap.from('.difference-case-stage', {
        autoAlpha: 0,
        y: 46,
        duration: .88,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.difference-case-stage', start: 'top 78%', once: true }
      });
      gsap.from('.knowledge-portal', {
        autoAlpha: 0,
        y: 34,
        stagger: .1,
        duration: .76,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.knowledge-portals', start: 'top 78%', once: true }
      });
    }

    activateChapter(0);
    if (treeNodes[0]) activateTreeNode(treeNodes[0]);
    if (tempoTabs[0]) activateTempo(tempoTabs[0]);
    if (caseTabs[0]) activateCase(caseTabs[0]);
  }, page);

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  window.addEventListener('pagehide', () => motion.revert(), { once: true });
  window.__yinggeLocaleRefresh?.();
})();
