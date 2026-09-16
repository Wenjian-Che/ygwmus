(() => {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'home-story.css?v=1.2.1';
  document.head.appendChild(stylesheet);

  const hero = document.querySelector('.hero');
  if (!hero || document.querySelector('#what-is-yingge')) return;

  const primaryCta = document.querySelector('.hero-actions .button-primary');
  if (primaryCta) {
    primaryCta.textContent = '开始认识英歌';
    primaryCta.setAttribute('href', '#what-is-yingge');
  }

  const definitionSection = document.createElement('section');
  definitionSection.className = 'home-definition';
  definitionSection.id = 'what-is-yingge';
  definitionSection.setAttribute('aria-labelledby', 'yinggeDefinitionTitle');
  definitionSection.innerHTML = `
    <div class="home-definition-copy">
      <h2 id="yinggeDefinitionTitle">英歌是什么？</h2>
      <p class="home-definition-lead">英歌是流传于潮汕及粤东部分地区的传统舞蹈。表演者手持双槌，在锣鼓和吆喝的节奏中，以步法、身法、槌法、人物扮演和队形行进，共同完成一场充满力量的集体表演。各地、各支队伍的表演又各有特点。</p>
      <p class="home-definition-context">它常见于春节、元宵、巡游与地方社区活动。普宁、潮阳、甲子等地区和不同队伍，在节奏、动作、脸谱与阵形上并不完全相同。</p>
      <a class="definition-link" href="learn.html#what-is-yingge">接着看一场英歌怎样展开</a>
    </div>
    <div class="home-definition-stage" aria-label="英歌由身体、双槌、锣鼓、角色和阵形共同构成">
      <p class="definition-stage-guide">选择一个视角，看看一场英歌怎样协同发生</p>
      <div class="definition-visual">
        <img src="assets/rhythm.png" alt="英歌槌、锣鼓、头饰与阵形构成的导览画面">
        <div class="definition-visual-shade"></div>
      </div>
      <div class="definition-thread thread-one" aria-hidden="true"></div>
      <div class="definition-thread thread-two" aria-hidden="true"></div>
      <button class="definition-point point-body is-active" type="button" data-definition="body"><strong>身体</strong><span>步法、身法与重心</span></button>
      <button class="definition-point point-clubs" type="button" data-definition="clubs"><strong>双槌</strong><span>对击与槌路</span></button>
      <button class="definition-point point-sound" type="button" data-definition="sound"><strong>锣鼓</strong><span>共同节拍与信号</span></button>
      <button class="definition-point point-role" type="button" data-definition="role"><strong>角色</strong><span>人物、脸谱与器物</span></button>
      <button class="definition-point point-space" type="button" data-definition="space"><strong>阵形</strong><span>站位、路线与变阵</span></button>
      <p class="definition-readout" id="homeDefinitionReadout" aria-live="polite"><strong class="definition-readout-label">身体</strong><span>先看重心、步法和槌路，力量从一个人的身体传到整支队伍。</span></p>
    </div>`;
  hero.insertAdjacentElement('afterend', definitionSection);

  const definitionCompanion = document.querySelector('.museum-companion');
  if (definitionCompanion && 'IntersectionObserver' in window) {
    const definitionObserver = new IntersectionObserver(entries => {
      definitionCompanion.classList.toggle('is-home-definition-visible', entries[0]?.isIntersecting === true);
    }, { threshold: .12 });
    definitionObserver.observe(definitionSection);
    window.addEventListener('pagehide', () => definitionObserver.disconnect(), { once: true });
  }

  const agentSection = document.createElement('section');
  agentSection.className = 'home-agent-stage';
  agentSection.id = 'ask-xiaochui';
  agentSection.dataset.agentState = 'idle';
  agentSection.setAttribute('aria-labelledby', 'homeAgentTitle');
  agentSection.innerHTML = `
    <div class="home-agent-intro">
      <div class="home-agent-character" aria-hidden="true"><span class="home-agent-sprite"></span></div>
      <p class="home-agent-kicker">智能导览</p>
      <h2 id="homeAgentTitle">先问一句，<br>再继续参观。</h2>
      <p>你可以直接问英歌是什么、怎样看阵形、如何辨认人物，也可以追问某个说法依据什么资料。</p>
      <div class="home-agent-suggestions" aria-label="推荐问题">
        <button type="button" data-home-agent-question="英歌是什么？第一次观看应该先看什么？">第一次怎么看英歌？</button>
        <button type="button" data-home-agent-question="英歌为什么持双槌？双槌在表演中起什么作用？">为什么要持双槌？</button>
        <button type="button" data-home-agent-question="英歌的脸谱、角色和队伍位置应该怎样一起理解？">怎样辨认人物？</button>
      </div>
    </div>
    <div class="home-agent-console" aria-label="与英歌小槌对话">
      <header>
        <div><strong>英歌小槌</strong><span id="homeAgentStatus">知识库已连接</span></div>
        <button type="button" id="homeAgentExpand">展开完整对话</button>
      </header>
      <div class="home-agent-messages" id="homeAgentMessages" role="log" aria-live="polite">
        <div class="home-agent-message assistant"><p>你好，我是英歌小槌。你可以从一个具体问题开始，我会尽量说明资料来源和适用范围。</p></div>
      </div>
      <form id="homeAgentForm">
        <label for="homeAgentInput">想先了解什么？</label>
        <div><input id="homeAgentInput" maxlength="500" autocomplete="off" placeholder="例如：英歌为什么要持双槌？"><button type="submit">提问</button></div>
        <div class="voice-control-row home-agent-voice-controls" aria-label="语音功能">
          <button type="button" data-voice-input data-voice-target="homeAgentInput" aria-pressed="false"><img class="voice-control-icon" src="assets/icons/tabler-microphone.svg" alt=""><span data-voice-label>语音输入</span></button>
          <button type="button" data-voice-output aria-pressed="false"><img class="voice-control-icon" src="assets/icons/tabler-volume.svg" alt=""><span data-voice-label>小槌朗读：关</span></button>
          <button type="button" data-voice-stop hidden><img class="voice-control-icon" src="assets/icons/tabler-player-stop.svg" alt=""><span data-voice-label>停止朗读</span></button>
          <div class="voice-state-card" data-voice-stage="idle"><span class="voice-state-mark" aria-hidden="true"><i></i></span><span class="voice-state-copy"><strong data-voice-state-label>语音就绪</strong><span data-voice-status aria-live="polite">点击开始，长按也可以说话</span></span><span class="voice-live-indicator" data-voice-activity hidden aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>
        </div>
        <p class="home-agent-note">回答依据馆内已核验资料，涉及地区、队伍和年代时会说明边界。</p>
      </form>
    </div>`;
  definitionSection.insertAdjacentElement('afterend', agentSection);

  const floatingCompanion = document.querySelector('.museum-companion');
  if (floatingCompanion && 'IntersectionObserver' in window) {
    const companionObserver = new IntersectionObserver(entries => {
      floatingCompanion.classList.toggle('is-home-agent-visible', entries[0]?.isIntersecting === true);
    }, { threshold: .16 });
    companionObserver.observe(agentSection);
    window.addEventListener('pagehide', () => companionObserver.disconnect(), { once: true });
  }

  const heroFilm = document.createElement('div');
  heroFilm.className = 'hero-film';
  heroFilm.setAttribute('aria-label', '英歌舞首页开场视频');
  heroFilm.innerHTML = `
    <video id="heroFilmVideo" muted playsinline preload="auto" poster="assets/rhythm.png"></video>
    <img class="hero-film-final" src="assets/opening-film-final.webp?v=20260827-2" alt="" aria-hidden="true">
    <div class="hero-film-shade" aria-hidden="true"></div>
    <button class="hero-film-skip" id="heroFilmSkip" type="button">跳过视频</button>`;
  hero.insertBefore(heroFilm, hero.firstChild);

  const filmVideo = heroFilm.querySelector('video');
  const filmSkip = heroFilm.querySelector('#heroFilmSkip');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filmSource = 'assets/opening-film.mp4';
  let filmAvailability;
  let filmSafetyTimer;
  let filmCompleting = false;
  let completionSent = false;

  const prepareHeroFilmViewport=()=>{
    if(window.history&&'scrollRestoration' in window.history)window.history.scrollRestoration='manual';
    document.documentElement.scrollTop=0;
    document.body.scrollTop=0;
    window.scrollTo({top:0,left:0,behavior:'instant'});
  };

  const hasHeroFilm = () => {
    if (!filmAvailability) {
      filmAvailability = fetch(filmSource, { method: 'HEAD', cache: 'no-store' })
        .then(response => response.ok)
        .catch(() => false);
    }
    return filmAvailability;
  };

  const sendHeroComplete = () => {
    if (completionSent) return;
    completionSent = true;
    window.clearTimeout(filmSafetyTimer);
    document.body.classList.remove('hero-film-playing');
    document.body.classList.add('hero-film-complete');
    filmSkip.setAttribute('aria-hidden', 'true');
    window.dispatchEvent(new CustomEvent('yingge:hero-film-complete'));
    ScrollTrigger?.refresh();
  };

  const useFallbackHero = () => {
    document.body.classList.remove('hero-film-ready', 'hero-film-playing');
    sendHeroComplete();
  };

  const freezeFinalFrame = () => {
    if (filmCompleting || completionSent) return;
    filmCompleting = true;
    window.clearTimeout(filmSafetyTimer);
    filmVideo.pause();
    document.body.classList.add('hero-film-ready');
    sendHeroComplete();
  };

  const startHeroFilm = async () => {
    prepareHeroFilmViewport();
    if (!await hasHeroFilm()) {
      useFallbackHero();
      return;
    }
    if (!filmVideo.getAttribute('src')) filmVideo.src = filmSource;
    document.body.classList.add('hero-film-ready');
    if (reducedMotion) {
      freezeFinalFrame();
      return;
    }
    document.body.classList.add('hero-film-playing');
    filmSkip.removeAttribute('aria-hidden');
    filmVideo.currentTime = 0;
    try {
      await filmVideo.play();
      filmSafetyTimer = window.setTimeout(freezeFinalFrame, 12000);
    } catch {
      freezeFinalFrame();
    }
  };

  filmVideo.addEventListener('ended', freezeFinalFrame);
  filmVideo.addEventListener('error', useFallbackHero, { once: true });
  filmSkip.addEventListener('click', freezeFinalFrame);
  hasHeroFilm().then(available => {
    if (available && !filmVideo.getAttribute('src')) filmVideo.src = filmSource;
  });

  if (document.body.classList.contains('page-ready')) startHeroFilm();
  else {
    const observer = new MutationObserver(() => {
      if (!document.body.classList.contains('page-ready')) return;
      observer.disconnect();
      startHeroFilm();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  const definitionCopy = {
    body: { label: '身体', labelEn: 'Body', text: '先看重心、步法和槌路，力量从一个人的身体传到整支队伍。', textEn: 'Start with balance, footwork, and stick paths: force travels from each body through the whole troupe.' },
    clubs: { label: '双槌', labelEn: 'Paired sticks', text: '双槌不仅制造声音，也把方向、速度和人与人的配合变得可见。', textEn: 'Paired sticks make sound while revealing direction, speed, and coordination between performers.' },
    sound: { label: '锣鼓', labelEn: 'Percussion', text: '鼓、锣钹、槌击和吆喝建立共同节拍，也发出段落与变阵信号。', textEn: 'Drums, gongs, cymbals, stick strikes, and calls establish a shared beat and signal transitions.' },
    role: { label: '角色', labelEn: 'Roles', text: '人物扮演、脸谱、服饰和器物需要回到具体地区与队伍中辨认。', textEn: 'Roles, facial patterns, costumes, and objects must be identified within a specific place and troupe.' },
    space: { label: '阵形', labelEn: 'Formation', text: '站位、间距和行进路线把个人动作组织成不断变化的集体空间。', textEn: 'Positions, spacing, and routes organise individual movements into a changing collective space.' }
  };
  const points = Array.from(document.querySelectorAll('.definition-point'));
  const readout = document.querySelector('#homeDefinitionReadout');
  const readoutLabel = readout?.querySelector('.definition-readout-label');
  const readoutText = readout?.querySelector('span');

  const activatePoint = point => {
    const copy = definitionCopy[point.dataset.definition];
    points.forEach(item => {
      const active = item === point;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (!copy || !readout || !readoutText) return;
    const updateReadout = () => { window.__yinggeSetLocalizedText?.(readoutLabel, copy.label, copy.labelEn); window.__yinggeSetLocalizedText?.(readoutText, copy.text, copy.textEn); };
    updateReadout();
    if (typeof gsap !== 'undefined' && !reducedMotion) gsap.fromTo(readout, { autoAlpha: .42, y: 7 }, { autoAlpha: 1, y: 0, duration: .32, ease: 'power3.out', overwrite: true });
  };

  const supportsDefinitionHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  points.forEach(point => {
    point.setAttribute('aria-pressed', String(point.classList.contains('is-active')));
    point.addEventListener('click', () => activatePoint(point));
    if (supportsDefinitionHover) point.addEventListener('mouseenter', () => activatePoint(point));
  });

  const homeAgentMessages = agentSection.querySelector('#homeAgentMessages');
  const homeAgentForm = agentSection.querySelector('#homeAgentForm');
  const homeAgentInput = agentSection.querySelector('#homeAgentInput');
  const homeAgentSubmit = homeAgentForm.querySelector('button[type="submit"]');
  const homeAgentStatus = agentSection.querySelector('#homeAgentStatus');
  let homeStreamingMessage = null;
  let homeAgentMotionTimer = 0;
  window.yinggeVoice?.refresh();

  const setHomeAgentMotion = (state = 'idle', hold = 0) => {
    window.clearTimeout(homeAgentMotionTimer);
    agentSection.dataset.agentState = state;
    if (hold > 0) homeAgentMotionTimer = window.setTimeout(() => {
      agentSection.dataset.agentState = 'idle';
    }, hold);
  };

  const scrollHomeAgent = () => { homeAgentMessages.scrollTop = homeAgentMessages.scrollHeight; };
  const appendHomeMessage = (role, text = '') => {
    const node = document.createElement('div');
    node.className = `home-agent-message ${role}`;
    const body = document.createElement('p');
    body.textContent = text;
    node.appendChild(body);
    homeAgentMessages.appendChild(node);
    scrollHomeAgent();
    return { node, body };
  };
  const renderHomeAnswer = (body, text) => {
    body.textContent = '';
    text.split('\n').forEach(line => {
      const clean = line.trim().replace(/^#{2,3}\s+/, '').replace(/^[-*]\s+/, '');
      if (!clean || clean === '---') return;
      const paragraph = document.createElement('p');
      paragraph.textContent = clean.replaceAll('**', '');
      body.appendChild(paragraph);
    });
  };
  const askFromHome = question => {
    const clean = question.trim();
    if (!clean || homeAgentSubmit.disabled) return;
    if (!window.yinggeGuide?.ask) {
      homeAgentStatus.textContent = '知识服务正在准备';
      window.__yinggeLocaleRefresh?.();
      return;
    }
    window.yinggeGuide.ask(clean);
    homeAgentInput.value = '';
  };

  homeAgentForm.addEventListener('submit', event => {
    event.preventDefault();
    askFromHome(homeAgentInput.value);
  });
  agentSection.querySelectorAll('[data-home-agent-question]').forEach(button => {
    button.addEventListener('click', () => askFromHome(button.dataset.homeAgentQuestion));
  });
  agentSection.querySelector('#homeAgentExpand').addEventListener('click', () => window.yinggeGuide?.open());

  window.addEventListener('yingge:agent-event', event => {
    const { type, text = '', citations = [] } = event.detail || {};
    if (type === 'user') appendHomeMessage('user', text);
    if (type === 'start') {
      setHomeAgentMotion('thinking');
      homeAgentSubmit.disabled = true;
      homeAgentStatus.textContent = '正在查阅馆内资料';
      homeStreamingMessage = appendHomeMessage('assistant is-thinking', '正在查阅资料…');
      window.__yinggeLocaleRefresh?.();
    }
    if (type === 'delta' && homeStreamingMessage) {
      homeStreamingMessage.node.classList.remove('is-thinking');
      homeStreamingMessage.body.textContent = text;
      scrollHomeAgent();
    }
    if (type === 'done' && homeStreamingMessage) {
      setHomeAgentMotion('answering', 1500);
      renderHomeAnswer(homeStreamingMessage.body, text);
      const safeCitations = citations.filter(item => {
        try { return new URL(item.url).protocol === 'https:'; } catch { return false; }
      }).slice(0, 3);
      if (safeCitations.length) {
        const sources = document.createElement('div');
        sources.className = 'home-agent-sources';
        safeCitations.forEach(item => {
          const link = document.createElement('a');
          link.href = item.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = item.title || '查看资料来源';
          sources.appendChild(link);
        });
        homeStreamingMessage.node.appendChild(sources);
      }
      homeAgentSubmit.disabled = false;
      homeAgentStatus.textContent = '知识库已连接';
      homeStreamingMessage = null;
      window.__yinggeLocaleRefresh?.();
      scrollHomeAgent();
    }
    if (type === 'error') {
      setHomeAgentMotion('idle');
      if (homeStreamingMessage) homeStreamingMessage.body.textContent = text;
      homeAgentSubmit.disabled = false;
      homeAgentStatus.textContent = '连接异常，请稍后再试';
      homeStreamingMessage = null;
      window.__yinggeLocaleRefresh?.();
    }
  });

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reducedMotion) {
    const definitionTimeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: definitionSection, start: 'top 68%', once: true }
    });
    definitionTimeline
      .from('.home-definition-copy > *', { autoAlpha: 0, y: 30, stagger: .09, duration: .72 })
      .from('.definition-visual', { autoAlpha: 0, scale: .93, rotation: -2, duration: 1.05 }, '<.08')
      .from('.definition-thread', { autoAlpha: 0, scale: .78, stagger: .12, duration: .9 }, '<.12')
      .from('.definition-point', { autoAlpha: 0, x: index => index % 2 ? 24 : -24, stagger: .08, duration: .56 }, '<.16')
      .from('.definition-readout', { autoAlpha: 0, y: 12, duration: .5 }, '<.1');

    const agentTimeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: agentSection, start: 'top 72%', once: true }
    });
    agentTimeline
      .from('.home-agent-character', { autoAlpha: 0, y: 28, scale: .92, duration: .72 })
      .from('.home-agent-intro > :not(.home-agent-character)', { autoAlpha: 0, y: 24, stagger: .08, duration: .58 }, '<.12')
      .from('.home-agent-console', { autoAlpha: 0, x: 34, duration: .8 }, '<.12')
      .from('.home-agent-message', { autoAlpha: 0, y: 12, duration: .42 }, '<.25');
  }

  window.addEventListener('load', () => ScrollTrigger?.refresh(), { once: true });
  // home-story is injected after app.js; re-run the locale pass so English
  // mode covers the generated definition and guide sections as well.
  window.__yinggeLocaleRefresh?.();
})();
