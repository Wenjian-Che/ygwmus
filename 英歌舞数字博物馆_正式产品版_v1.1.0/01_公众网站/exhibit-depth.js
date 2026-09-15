(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  const main = document.querySelector('main');
  if (!main || document.querySelector('[data-depth-layer]')) return;
  const nativeLearningPage = page === 'learn.html' && Boolean(document.querySelector('.knowledge-page #tempo'));

  if (!nativeLearningPage) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'exhibit-depth.css?v=20260827-2';
    document.head.appendChild(style);
  }

  const standard = 'https://www.stpt.edu.cn/_upload/article/files/53/40/58838af7487794853b6cb93946b9/4d483414-a74c-4fc9-a1c4-839762c52e07.pdf';
  const chaoyang = 'https://www.ihchina.cn/project_details/12901.html';
  const puning = 'https://www.ihchina.cn/project_details/12902.html';
  const national = 'https://www.mct.gov.cn/whzx/ggtz/200606/t20060609_694679.htm';
  const helong = 'https://www.stpt.edu.cn/yinggewu/2025/0328/c4646a41573/page.htm';
  const longgang = 'https://www.stpt.edu.cn/yinggewu/2025/0306/c4703a41232/page.htm';

  const sourceRibbon = links => `<div class="depth-sources"><strong>继续核对</strong>${links.map(link => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`).join('')}</div>`;

  const insertBefore = (selector, html) => {
    const target = document.querySelector(selector);
    if (target) target.insertAdjacentHTML('beforebegin', html);
    else main.insertAdjacentHTML('beforeend', html);
  };

  // The learning page now owns these sections in its main document. Keep the
  // legacy injector only as a fallback for older copies that do not have them.
  if (page === 'learn.html' && !nativeLearningPage) {
    insertBefore('#difference', `
      <section class="depth-section tempo-section" id="tempo" data-depth-layer>
        <div class="depth-heading">
          <h2>快慢不是速度标签，而是三种身体时间。</h2>
          <p>地方标准把传统潮阳英歌按节奏划分为慢板、中板和快板。差别不仅在鼓点快慢，也会进入槌的长度、动作组合、身体幅度与队伍气质。</p>
        </div>
        <div class="tempo-lab" data-tempo="slow">
          <div class="tempo-visual" aria-hidden="true">
            <div class="tempo-ring ring-a"></div><div class="tempo-ring ring-b"></div><div class="tempo-ring ring-c"></div>
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            <strong id="tempoWord">沉稳蓄势</strong>
          </div>
          <div class="tempo-copy">
            <div class="tempo-switch" aria-label="选择节奏板式">
              <button class="is-active" type="button" data-tempo-choice="slow" aria-pressed="true">慢板</button>
              <button type="button" data-tempo-choice="medium" aria-pressed="false">中板</button>
              <button type="button" data-tempo-choice="fast" aria-pressed="false">快板</button>
            </div>
            <h3 id="tempoTitle">动作在停顿中积蓄力量</h3>
            <p id="tempoBody">慢板鼓点悠缓，击槌常以三下或四下构成一组。观看时可以留意动作怎样在较长的时间里完成下沉、转身和收势。</p>
            <dl id="tempoFacts"><div><dt>节奏感</dt><dd>悠缓、厚重</dd></div><div><dt>观察点</dt><dd>蓄势与收势</dd></div></dl>
          </div>
        </div>
        ${sourceRibbon([{url: standard, label: '查看《DB 4405/T 315-2025 潮阳英歌》适用范围与分类'}])}
      </section>
      <section class="depth-section living-section" id="living">
        <div class="living-title"><h2>传统不是静止的样本。</h2><p>同在潮阳，不同社区也会形成不同的槌法、人物设定和传承方式。比较具体队伍，比概括一个地区更接近真实。</p></div>
        <div class="living-cases">
          <article>
            <figure><img src="assets/motion-archive.png" alt="英歌队伍动作与阵形视觉"></figure>
            <div><h3>河陇英歌：一支队伍怎样形成自己的动作语汇</h3><p>公开队伍资料记录了竖槌、快板、手指旋槌，以及双箭穿云、双龙戏水等常用阵形。这里展示的是河陇队的具体实践，不能替代其他队伍。</p><a href="${helong}" target="_blank" rel="noreferrer">查看队伍资料</a></div>
          </article>
          <article>
            <figure><img src="assets/jiaque.png" alt="英歌小槌形象，用于表现当代青年参与英歌"></figure>
            <div><h3>龙港女子英歌：传承也包含当代选择</h3><p>2024 年重新组建的龙港女子英歌队以中学生为主体，并以花木兰为人物设定。它说明活态传承既保留基本步伐和槌法，也会回应新的参与者与社区表达。</p><a href="${longgang}" target="_blank" rel="noreferrer">查看队伍资料</a></div>
          </article>
        </div>
      </section>`);
  }

  if (nativeLearningPage) return;

  if (page === 'watch.html') {
    insertBefore('#boundary', `
      <section class="depth-section performance-anatomy" id="anatomy" data-depth-layer>
        <div class="depth-heading"><h2>画面里同时有三条线。</h2><p>看懂英歌，不是把视频切成动作名称。你需要同时追踪时间、身体和空间，并在三条线交会时判断一次变化为什么发生。</p></div>
        <div class="anatomy-stage">
          <div class="anatomy-image"><img src="assets/film-02.png" alt="声音、身体与空间三条观察线的概念示意，不是现场表演记录"></div>
          <div class="anatomy-lines">
            <article><b>时间线</b><h3>声音何时改变</h3><p>听鼓点的循环、重音与停顿，记录变阵前是否出现新的声音信号。</p></article>
            <article><b>身体线</b><h3>力量从哪里发出</h3><p>从脚下重心看到躯干转动，再看力量怎样进入手腕和双槌。</p></article>
            <article><b>空间线</b><h3>人与人怎样重新排列</h3><p>观察朝向、间距和路线，不只在队形完成后才认一个名称。</p></article>
          </div>
        </div>
        <div class="historical-structure"><h3>传统队伍曾不只有前棚</h3><p>2025 年潮阳地方标准的编制说明记载，传统队伍由前棚、中棚和后棚组成。前棚是英歌主体，中棚多见地方戏曲、民间小戏、小曲或杂技，后棚多为武术表演。今天常见的潮阳英歌多指前棚，因此观看当代影像时，不宜把一段前棚画面当成传统队伍全部结构。</p></div>
        ${sourceRibbon([{url: standard, label: '查看地方标准的编制说明'}, {url: chaoyang, label: '查看潮阳英歌国家级项目页'}])}
      </section>`);
  }

  if (page === 'characters.html') {
    insertBefore('#face', `
      <section class="depth-section role-system" id="role-system" data-depth-layer>
        <div class="depth-heading"><h2>角色先是一种队伍职责。</h2><p>潮阳地方标准把队长、教练、指挥、引舞、领舞、舞队和乐队分开记录。人物故事提供叙事，现场职责则决定队伍怎样运行。</p></div>
        <div class="role-spine">
          <article><strong>指挥</strong><p>用鼓点把握行进速度、节奏和套路变化。部分队伍由宋江或林冲的扮演者承担。</p></article>
          <article><strong>引舞</strong><p>在前方开路、打场并协助指挥，较常见的是耍蛇的时迁。</p></article>
          <article><strong>头槌与二槌</strong><p>位于队伍前部，接收号令并带领舞队。潮阳标准记录的常见对应人物包括秦明、关胜和李逵，但不是所有队伍都相同。</p></article>
          <article><strong>舞队与乐队</strong><p>舞队完成动作和队形，乐队建立共同时间。英歌的主体不是单个英雄，而是职责之间的协同。</p></article>
        </div>
        ${sourceRibbon([{url: standard, label: '查看地方标准中的队伍结构与职责'}])}
      </section>
      <section class="depth-section face-boundary" id="face-boundary">
        <div><h2>脸谱不是颜色密码。</h2><p>地方标准把潮阳英歌脸谱分为戏面脸谱和鬼面脸谱，并明确提醒：采用戏面脸谱时，通常只有队伍前几位扮演者具有较明确、为人熟悉的英雄身份，其余表演者多不确定具体身份。</p></div>
        <div class="face-types"><article><h3>戏面脸谱</h3><p>借鉴戏剧妆容，以人物特征组织眉、眼、鼻、嘴和脸纹。不同流派与队伍会形成不同图谱。</p></article><article><h3>鬼面脸谱</h3><p>多以黑白为主，和戏面系统不是同一套辨认逻辑。理解时仍要回到队伍资料和演出语境。</p></article></div>
      </section>`);
  }

  if (page === 'formation.html') {
    insertBefore('#evidence', `
      <section class="depth-section formation-grammar" id="formationGrammar" data-depth-layer>
        <div class="depth-heading"><h2>七种基础队形，呈现七种空间组织方式。</h2><p>2025 年地方标准列出的七种基础队形适用于传统潮阳英歌的传承与演练。这里把阵名还原为可以观察的空间语法，不能直接泛化到所有地区。</p></div>
        <div class="formation-strip" aria-label="七种基础队形的空间关系">
          <article><b>双列</b><span>平行前进</span></article><article><b>方形</b><span>两组并列</span></article><article><b>双龙出海</b><span>中部分裂</span></article><article><b>田螺</b><span>单列卷成螺旋</span></article><article><b>麦穗花</b><span>内外反向穿行</span></article><article><b>四海升平</b><span>四圈十字对称</span></article><article><b>八卦</b><span>内外圆与 S 形</span></article>
        </div>
        <div class="formation-reading"><div><h3>阵形不是静态图案</h3><p>同一个图形必须放进行进过程里看。队员从哪里进入，怎样保持间距，在哪个信号上改变方向，决定了阵形是否成立。</p></div><div><h3>标准不是全国统一规则</h3><p>该标准明确适用于传统潮阳英歌。其他地区、村落与队伍可有不同名称、人数、路线和演练方法。</p></div></div>
        ${sourceRibbon([{url: standard, label: '查看七种基础队形原始图示与文字定义'}])}
      </section>`);
  }

  if (page === 'sound.html') {
    insertBefore('#listening', `
      <section class="depth-section signal-system" id="signal-system" data-depth-layer>
        <div class="depth-heading"><h2>声音是现场协作的一部分。</h2><p>潮阳地方标准记录了指挥通过鼓点把握速度、节奏、队形和套路变化。锣、钹、槌击与吆喝可能强化共同节拍；具体信号如何对应动作，仍要结合具体队伍和带时间码的片段核对。</p></div>
        <div class="signal-score">
          <div class="score-source"><strong>鼓点</strong><span>发出速度与变化信号</span></div>
          <div class="score-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="score-response"><article><b>身体</b><span>落步、转身、击槌</span></article><article><b>队形</b><span>转向、分合、穿插</span></article><article><b>现场</b><span>锣钹、吆喝与观众感受</span></article></div>
        </div>
        <div class="tempo-boundary"><h3>慢板、中板、快板不能只用 BPM 理解</h3><p>地方标准同时记录了鼓点循环、击槌组合和动作气质。慢板强调沉稳蓄势，中板更舒展饱满，快板则鼓点紧凑、动作急速。它们是身体、器物和集体协作共同形成的板式。</p></div>
        ${sourceRibbon([{url: standard, label: '查看乐器、指挥职责与板式分类'}])}
      </section>`);
  }

  if (page === 'regions.html') {
    insertBefore('#map', `
      <section class="depth-section region-evidence" id="region-evidence" data-depth-layer>
        <div class="depth-heading"><h2>先分清名录、流传地和队伍案例。</h2><p>地图上的高亮不能只表达“哪里有英歌”。它至少要区分国家级项目申报地区、公开资料中的流传范围，以及本馆已经核对到具体队伍的地点。</p></div>
        <div class="region-levels">
          <article><strong>国家名录</strong><p>2006 年第一批国家级非遗名录把英歌列为传统舞蹈，申报地区为广东省揭阳市、汕头市，对应普宁英歌和潮阳英歌。</p></article>
          <article><strong>扩展项目</strong><p>甲子英歌于 2011 年列入第三批国家级非物质文化遗产扩展项目，申报地区为广东省陆丰市。项目关系不能等同于整个行政区域采用同一种传统。</p></article>
          <article><strong>具体队伍</strong><p>同一地区内部也有快慢板、槌法、人物和传承方式的差异。真正的比较应继续下沉到社区、队伍和年代。</p></article>
        </div>
        <div class="within-one-place"><h3>同在潮阳，也不是一个版本</h3><p>河陇英歌以竖槌、快板和手指旋槌见长；2024 年重新组建的龙港女子英歌队则以中学生为主体，并采用花木兰人物设定。地区名称只是入口，队伍实践才是内容。</p><div><a href="${helong}" target="_blank" rel="noreferrer">河陇队资料</a><a href="${longgang}" target="_blank" rel="noreferrer">龙港女子队资料</a></div></div>
        ${sourceRibbon([{url: national, label: '第一批国家级非遗名录'}, {url: chaoyang, label: '潮阳英歌项目页'}, {url: puning, label: '普宁英歌项目页'}])}
      </section>`);
  }

  if (page === 'archive.html') {
    insertBefore('#review', `
      <section class="depth-section claim-lab" id="claim-lab" data-depth-layer>
        <div class="depth-heading"><h2>一条看似正确的话，也可能说得太满。</h2><p>档案工作的核心不是收集更多链接，而是把一句话拆成对象、时间、地点、来源和适用范围，再决定它能否公开展示。</p></div>
        <div class="claim-anatomy">
          <div class="claim-too-wide"><span>过度概括</span><blockquote>英歌队的每位舞者都扮演一名梁山好汉。</blockquote></div>
          <div class="claim-correction"><h3>怎样改成可以核对的表述</h3><p>水浒英雄是英歌重要的人物叙事资源。潮阳地方标准同时注明，采用戏面脸谱的队伍通常只有前几位表演者具有较明确的人物身份，其余表演者多不确定。具体队伍也可能建立自己的完整脸谱谱系。</p><dl><div><dt>对象</dt><dd>采用戏面脸谱的潮阳英歌队伍</dd></div><div><dt>证据</dt><dd>地方标准与具体队伍资料</dd></div><div><dt>边界</dt><dd>不能推成所有英歌、所有队员</dd></div></dl></div>
        </div>
        ${sourceRibbon([{url: standard, label: '查看地方标准的脸谱说明'}, {url: helong, label: '查看具体队伍的 108 脸谱案例'}])}
      </section>`);
  }

  if (page === 'content.html') {
    insertBefore('#coreExhibits', `
      <section class="depth-section museum-method" id="museumMethod" data-depth-layer>
        <div class="depth-heading"><h2>从整体、结构与来源三层建立理解。</h2><p>先保留现场感，再拆开动作、声音和空间，最后回到地区、队伍和来源。三层观察彼此补充，能减少只看热闹或只背知识条目的误解。</p></div>
        <ol class="method-sequence"><li><strong>先看现场</strong><span>不暂停，不急着认人物，先感受队伍怎样进入同一节拍。</span></li><li><strong>再拆结构</strong><span>分别追踪身体、双槌、声音、角色和路线。</span></li><li><strong>最后核对</strong><span>确认这次表演属于哪里、哪支队伍、哪个年代，资料来自何处。</span></li></ol>
      </section>`);
  }

  // The depth layer is injected after app.js has applied the locale. Refresh
  // the public-page translator so English mode also covers these new leaves.
  window.__yinggeLocaleRefresh?.();

  const tempoData = {
    slow: {word:'沉稳蓄势', title:'动作在停顿中积蓄力量', body:'慢板鼓点悠缓，击槌常以三下或四下构成一组。观看时可以留意动作怎样在较长的时间里完成下沉、转身和收势。', facts:[['节奏感','悠缓、厚重'],['观察点','蓄势与收势']]},
    medium: {word:'舒展饱满', title:'动作幅度在稳定节拍中展开', body:'中板节奏介于快板与慢板之间，击槌组合更为多样。它的重点不只是中等速度，而是稳定、圆活和充分展开的身体幅度。', facts:[['节奏感','适中、连贯'],['观察点','幅度与圆活']]},
    fast: {word:'威猛欢跃', title:'紧凑鼓点推动动作与阵势', body:'快板鼓点紧凑，舞蹈节奏急速，短槌更利于灵活运转。观看时要同时追踪手上槌路和脚下路线，避免只看速度。', facts:[['节奏感','紧凑、热烈'],['观察点','槌路与阵势']]}
  };

  const tempoLab = document.querySelector('.tempo-lab');
  document.querySelectorAll('[data-tempo-choice]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.tempoChoice;
    const data = tempoData[key];
    if (!tempoLab || !data) return;
    document.querySelectorAll('[data-tempo-choice]').forEach(item => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    tempoLab.dataset.tempo = key;
    const update = () => {
      document.querySelector('#tempoWord').textContent = data.word;
      document.querySelector('#tempoTitle').textContent = data.title;
      document.querySelector('#tempoBody').textContent = data.body;
      document.querySelector('#tempoFacts').innerHTML = data.facts.map(item => `<div><dt>${item[0]}</dt><dd>${item[1]}</dd></div>`).join('');
      window.__yinggeLocaleRefresh?.();
    };
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.to('.tempo-copy h3,.tempo-copy>p,.tempo-copy dl', {autoAlpha:0, y:10, duration:.16, onComplete:update});
      gsap.to('.tempo-copy h3,.tempo-copy>p,.tempo-copy dl', {autoAlpha:1, y:0, duration:.45, delay:.18, ease:'power3.out'});
      gsap.fromTo('.tempo-visual i', {scaleY:.35}, {scaleY:1, stagger:.045, duration:key === 'fast' ? .24 : key === 'medium' ? .42 : .68, ease:'power3.out'});
    } else update();
  }));

  if (window.gsap && window.ScrollTrigger && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.utils.toArray('.depth-section').forEach(section => {
      const items = section.querySelectorAll('.depth-heading>*:not(:empty),.living-cases article,.role-spine article,.formation-strip article,.formation-reading>div,.region-levels article,.method-sequence li,.depth-sources');
      if (!items.length) return;
      gsap.from(items, {autoAlpha:0, y:28, stagger:.065, duration:.7, ease:'power3.out', scrollTrigger:{trigger:section,start:'top 76%',once:true}});
    });
    ScrollTrigger.refresh();
  }
})();
