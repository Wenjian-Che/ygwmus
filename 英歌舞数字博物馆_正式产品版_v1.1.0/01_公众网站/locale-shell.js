(() => {
  const key = 'yingge-locale';
  const page = location.pathname.split('/').pop() || 'index.html';
  const requested = new URLSearchParams(location.search).get('lang');
  let locale = requested === 'en' || requested === 'zh' ? requested : (localStorage.getItem(key) === 'en' ? 'en' : 'zh');
  const copy = {
    '英歌舞数字博物馆':'Yingge Dance Digital Museum','专题展馆':'Themed gallery','首页':'Home','馆藏总览':'Collections','认识英歌':'Learn Yingge','英歌出海':'Yingge abroad','在线展馆':'Online exhibits','看英歌':'Watch Yingge','识角色':'Meet the roles','练阵形':'Practice formations','听锣鼓':'Hear the drums','游地域':'Explore regions','查档案':'Browse archives','问英歌小槌':'Ask Yingge Xiaochui','英歌小槌':'Yingge Xiaochui','关闭':'Close','发送':'Send','向英歌小槌提问':'Ask Yingge Xiaochui','问问这一幕在讲什么':'Ask about this scene','跳至英歌小槌':'Skip to Yingge Xiaochui','正在参观':'Now visiting','视觉导入':'Visual introduction','这一幕想表达什么？':'What is this scene expressing?','这些视觉元素与英歌有什么关系？':'How do these visual elements relate to Yingge?','英歌小槌在这里做什么？':'What is Yingge Xiaochui doing here?','线下体验怎样帮助理解英歌？':'How does the on-site experience help us understand Yingge?','四类数字展项分别讲什么？':'What do the four digital exhibits show?','好汉览谱能怎样认识英歌人物？':'How does Heroes’ Facial Patterns introduce Yingge roles?','H5 怎样帮助传播英歌？':'How can an H5 experience share Yingge?','打开木疙瘩体验前要看什么？':'What should I know before opening the Mugeda experience?','这些合作案例与英歌有什么关系？':'How do these collaborations relate to Yingge?','中泰英歌交流发生了什么？':'What happened in the China–Thailand Yingge exchange?','具体事件，具体来源，具体边界':'Specific events, sources, and boundaries','真实事件专题':'Verified events feature','三次具体事件，呈现三种并列的跨境交流形态。':'Three specific events showing three forms of cross-border exchange.','三次交流，三种传播方式':'Three exchanges, three ways of travelling','怎样阅读这条时间线':'How to read this timeline','去资料档案了解证据分级':'See the archive for evidence levels','来源详情':'Source details','时间':'Date','地点':'Location','参与队伍':'Participating troupes','参与主体':'Participants','公开事实':'Public fact','这一场如何发生':'How this event happened','页面呈现':'How it is presented','适用边界':'Scope and limits','可点击来源':'Clickable sources','关闭来源详情':'Close source details','这里是一套专题视觉叙事，从英歌小槌、线下体验、线上探索、数字展项与合作实践等角度展开。你可以问我当前画面在讲什么，也可以继续追问英歌本身。':'This visual story follows Yingge Xiaochui through on-site experiences, online exploration, digital exhibits, and collaboration. Ask what a scene means or keep exploring Yingge itself.','专题展馆导览':'Themed gallery guide','当前章节推荐问题':'Suggested questions for this section','英歌出海':'Yingge abroad','英歌出海：跨国传播时间线':'Yingge abroad: a cross-border timeline','查看来源与边界':'View sources and scope','研究注释':'Research note','观察提示':'Observation prompt','资料来源':'Sources','参与：':'Participants:','本条以文字记录呈现':'This entry is presented as text','你仍可以通过活动信息和公开来源了解这次交流。':'You can still learn about this exchange through the event details and public sources.','具体事件，具体来源，具体边界':'Specific events, sources, and boundaries','三次发生在东南亚的真实交流，呈现三种并列的跨境交流形态。':'Three real exchanges in Southeast Asia, showing three parallel forms of cross-border exchange.','三个个案分别让人看见怎样共同表演、怎样在地组队，以及怎样继续交流。它们发生在不同主体、地点和时间中，本专题将其并置观察，不把个案拼成一条必然的发展路线。':'Three cases show joint performance, local troupe building, and continued exchange. They happened across different people, places, and dates; this feature places them side by side without treating them as one inevitable path.','本展只描述已核验的具体活动。它不代表所有英歌队伍的海外传播路径，也不把合作材料中的个人叙述直接视为公共史料。':'This feature describes only verified activities. It does not represent every Yingge troupe’s overseas path, and it does not treat personal accounts in collaboration materials as public historical sources.','普宁英歌与泰国英歌队在曼谷共同表演':'Puning Yingge and a Thai Yingge troupe perform together in Bangkok','泰国曼谷河滨码头夜市广场':'Riverside Night Market Square, Bangkok, Thailand','广东普宁富美青年英歌队、泰国春武里府旧罔县文益英歌队':'Guangdong Puning Fumei Youth Yingge Troupe; Wenying Yingge Troupe, Chon Buri, Thailand','两支队伍在曼谷共同表演。活动随后继续前往叻丕府和春武里府交流。':'The two troupes performed together in Bangkok, then continued exchanges in Ratchaburi and Chon Buri.','普宁富美青年英歌队与泰国文益英歌队在曼谷共同表演，交流随后继续前往叻丕府和春武里府。':'The Puning Fumei Youth Yingge Troupe and Thailand’s Wenying Yingge Troupe performed together in Bangkok; exchanges continued in Ratchaburi and Chon Buri.','共同表演让交流从观看变成双方都参与的实践。':'Joint performance turns exchange from watching into a practice in which both sides participate.','柔佛潮州八邑会馆义兴英歌队举行成立仪式':'The Yixing Yingge Troupe of the Johor Teochew Eight Districts Association holds its founding ceremony','马来西亚柔佛州新山市':'Johor Bahru, Johor, Malaysia','柔佛潮州八邑会馆义兴英歌队、汕头市友好代表团':'Yixing Yingge Troupe of the Johor Teochew Eight Districts Association; Shantou friendship delegation','潮阳城南忠精英歌队赴新加坡交流':'Chaoyang Chengnan Zhongyi Yingge Troupe visits Singapore for an exchange','新加坡':'Singapore','潮阳城南忠英歌队、新加坡潮阳会馆':'Chaoyang Chengnan Zhongyi Yingge Troupe; Singapore Chaoyang Association','政府或公共机构':'Government or public institution','主流媒体报道':'Mainstream media report','机构页面':'Institution page','公开来源':'Public source','现场图片与文字来源':'Field images and written source','文字记录与公开来源':'Written record and public sources','本条只说明这次具体活动，不代表所有队伍的跨境传播方式。':'This entry describes this specific activity only; it does not represent how all troupes travel across borders.'
  };
  Object.assign(copy, {
    '一行45人应邀赴新加坡，在五天行程中进行了四场交流表演。':'A delegation of 45 was invited to Singapore and gave four exchange performances over five days.',
    '潮阳城南忠精英歌队':'Chaoyang Chengnan Zhongyi Yingge Troupe',
    '潮阳城南忠精英歌队、新加坡潮阳会馆':'Chaoyang Chengnan Zhongyi Yingge Troupe; Singapore Chaoyang Association',
    'LOGO 01':'LOGO 01','LOGO 02':'LOGO 02',
    '寻迹四百年\n小槌传英歌':'Tracing Four Centuries\nXiaochui and Yingge',
    '以IP形象「英歌小槌」为寻迹者，穿越时空寻找英歌舞传承印记，以纪实+穿越手法，展现非遗文化的代代坚守与青春接力。':'With Yingge Xiaochui as the guide, this documentary journey crosses time to trace Yingge transmission and the relay between generations.',
    '轻量化H5':'Lightweight H5',
    '以轻量化H5实现非遗资源数字化留存，降低文化认知门槛，推动潮汕英歌舞面向青年群体活态传播。':'A lightweight H5 preserves intangible-heritage resources digitally, lowers the barrier to understanding, and helps Chaoshan Yingge reach younger audiences.',
    '潮汕英歌舞数字博物馆':'Chaoshan Yingge Dance Digital Museum','鼓韵探源 | 品百年历史':'Tracing drum rhythms | A century of history','趣玩非遗':'Play with heritage','好汉览谱':'Meet the heroes','英歌观韵':'Hear Yingge','数字寻古':'Search the past digitally','合作方参阅':'For collaborators','查看视频':'View video',
    '活动时间、地点与队伍依据中国驻泰国大使馆和外交部页面；两张现场影像已按项目授权记录完成权利与隐私复核，仅用于呈现活动现场。':'Event dates, locations, and troupes follow pages from the Chinese Embassy in Thailand and the Ministry of Foreign Affairs. The two field images were reviewed for rights and privacy under the project authorisation record and are used only to show the event setting.',
    '中华人民共和国驻泰王国大使馆':'Embassy of the People’s Republic of China in the Kingdom of Thailand','中华人民共和国外交部转载':'Reposted by the Ministry of Foreign Affairs of the People’s Republic of China',
    '汕头市委外办记录代表团参加义兴英歌队成立仪式，说明海外交流已从观看延伸到在地队伍建设。':'A Shantou foreign-affairs office record documents the delegation at the Yixing Yingge founding ceremony, showing exchange extending from viewing to local troupe building.','汕头市友好代表团参加柔佛义兴英歌队成立仪式，交流开始进入在地队伍建设。':'A Shantou friendship delegation joined the Johor Yixing Yingge founding ceremony, moving exchange into local troupe building.',
    '合作材料使用了“首支英歌队”的表述。本展当前只采用政府页面可核验的队伍成立事实，不采用“首支”结论。':'Collaboration materials use the phrase “first Yingge troupe”. This feature uses only the verifiable founding fact on government pages and does not adopt the “first” claim.','现有官方页面支持成立仪式事实，不足以支持‘首支英歌队’等更强结论；现场影像已按项目授权记录完成权利与隐私复核，仅用于呈现成立仪式场景。':'Available official pages support the founding-ceremony fact, but not the stronger claim of a “first Yingge troupe”. Field images were reviewed under the project authorisation record and are used only to show the ceremony setting.','中共汕头市委外事工作委员会办公室':'Foreign Affairs Office of the CPC Shantou Municipal Committee','潮阳城南忠精英歌队赴新加坡，在五天行程中进行四场交流表演。':'The Chaoyang Chengnan Zhongyi Yingge Troupe travelled to Singapore for four exchange performances over five days.','人数、行程与场次依据现有主流媒体页面。':'Headcount, itinerary, and number of performances follow the available mainstream media pages.','南方日报、南方+':'Nanfang Daily and Nanfang+'
  });
  const titles = { 'framework-museum.html':['专题展馆｜英歌舞数字博物馆','Themed Gallery | Yingge Dance Digital Museum'], 'spread.html':['英歌出海｜英歌舞数字博物馆','Yingge Abroad | Yingge Dance Digital Museum'], 'framework.html':['NoiSee_Y — Visual Portfolio','Yingge Dance Digital Museum | Visual Gallery'] };
  const iframeCopy = {
    '英歌小槌':'Yingge Xiaochui','线下体验':'On-site experience','线上探索':'Online exploration',
    '寻迹四百年\n小槌传英歌':'Tracing Four Centuries\nXiaochui and Yingge',
    '以IP形象「英歌小槌」为寻迹者，穿越时空寻找英歌舞传承印记，以纪实+穿越手法，展现非遗文化的代代坚守与青春接力。':'With Yingge Xiaochui as the guide, this documentary journey crosses time to trace Yingge transmission and the relay between generations.',
    '轻量化H5':'Lightweight H5',
    '以轻量化H5实现非遗资源数字化留存，降低文化认知门槛，推动潮汕英歌舞面向青年群体活态传播。':'A lightweight H5 preserves intangible-heritage resources digitally, lowers the barrier to understanding, and helps Chaoshan Yingge reach younger audiences.',
    '潮汕英歌舞数字博物馆':'Chaoshan Yingge Dance Digital Museum','鼓韵探源 | 品百年历史':'Tracing drum rhythms | A century of history','趣玩非遗':'Play with heritage','好汉览谱':'Meet the heroes','英歌观韵':'Hear Yingge','数字寻古':'Search the past digitally','合作方参阅':'For collaborators',
    '“一见英歌如「故」”展和“文化兴乡计划”专题论坛 广交会':'“Yingge Feels Like Home” exhibition and Cultural Revitalisation Forum · Canton Fair','策划和承办电影节活动和新闻发布会 第27届上海国际电影节':'Planning and hosting film-festival events and a press conference · 27th Shanghai International Film Festival','演讲《基于热爱的事业》':'Talk: “A Career Built on Passion”','中泰英歌历史首次合体表演':'First China–Thailand Yingge joint performance','自劳地AI视频研学营 郑正秋故里':'Zilaodi AI video study camp · Zheng Zhengqiu’s hometown',
    '顶部作品展示':'Top showcase','Orbit Carousel 3D 作品展示':'3D orbit carousel showcase','品牌标志占位':'Brand logo placeholders','创作关键词':'Creative keywords','英歌小槌主题图片':'Yingge Xiaochui theme image','叠放作品展示':'Stacked work showcase','滚动卡片序列':'Scrolling card sequence','视频项目':'Video projects',
    '“一见英歌如「故」”展和“文化兴乡计划”专题论坛 广交会作品封面':'Cover image: “Yingge Feels Like Home” exhibition and Cultural Revitalisation Forum · Canton Fair','策划和承办电影节活动和新闻发布会 第27届上海国际电影节作品封面':'Cover image: film-festival events and press conference · 27th Shanghai International Film Festival','演讲《基于热爱的事业》作品封面':'Cover image: “A Career Built on Passion” talk','中泰英歌历史首次合体表演作品封面':'Cover image: first China–Thailand Yingge joint performance','自劳地AI视频研学营 郑正秋故里作品封面':'Cover image: Zilaodi AI video study camp · Zheng Zhengqiu’s hometown'
  };
  // The visual framework can also be opened directly during a rehearsal.
  // Reuse the iframe dictionary there so the standalone route has the same
  // complete English coverage as the museum shell.
  if (page === 'framework.html') Object.assign(copy, iframeCopy);
  const refreshIframe = iframe => {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
      doc.querySelectorAll('body *:not(script):not(style)').forEach(node => {
        if (node.children.length) return;
        const zh = node.dataset.localeZh || node.textContent.trim();
        const en = iframeCopy[zh];
        if (!en) return;
        if (!node.dataset.localeZh) node.dataset.localeZh = zh;
        node.textContent = locale === 'en' ? en : node.dataset.localeZh;
      });
      ['aria-label','title','alt','placeholder'].forEach(attr => {
        const key = 'locale' + attr.replace(/[^a-z0-9]/gi, '_');
        doc.querySelectorAll(`body *:not(script):not(style)[${attr}]`).forEach(node => {
          const zh = node.dataset[key] || node.getAttribute(attr) || '';
          const en = iframeCopy[zh];
          if (!en) return;
          if (!node.dataset[key]) node.dataset[key] = zh;
          node.setAttribute(attr, locale === 'en' ? en : node.dataset[key]);
        });
      });
      if (!iframe.dataset.localeObserver && doc.body) {
        iframe.dataset.localeObserver = 'true';
        const observer = new MutationObserver(() => {
          // Disconnect while applying our own text changes, otherwise the
          // observer would continuously react to its own translations.
          observer.disconnect();
          refreshIframe(iframe);
          if (iframe.contentDocument?.body) observer.observe(iframe.contentDocument.body, { subtree: true, childList: true, characterData: true });
        });
        iframe.__yinggeLocaleObserver = observer;
        observer.observe(doc.body, { subtree: true, childList: true, characterData: true });
      }
    } catch (_) { /* cross-document access can be unavailable during navigation */ }
  };
  const hrefLabels = { 'index.html':'Home','content.html':'Collections','learn.html':'Learn Yingge','spread.html':'Yingge abroad','framework-museum.html':'Themed gallery','watch.html':'Watch Yingge','characters.html':'Meet the roles','formation.html':'Practice formations','sound.html':'Hear the drums','regions.html':'Explore regions','archive.html':'Browse archives' };
  const setLocalized = (node, en) => {
    if (!node) return;
    if (!node.dataset.localeZh) node.dataset.localeZh = node.textContent.trim();
    node.textContent = locale === 'en' ? en : node.dataset.localeZh;
  };
  const localizeAttributes = () => {
    const fallback = {
      '跳至英歌小槌':'Skip to Yingge Xiaochui','返回英歌舞数字博物馆首页':'Back to Yingge Dance Digital Museum home',
      '数字博物馆导航':'Digital museum navigation','当前章节推荐问题':'Suggested questions for this section',
      '关闭英歌小槌':'Close Yingge Xiaochui','英歌小槌':'Yingge Xiaochui'
    };
    ['aria-label','title','alt','placeholder'].forEach(attr => {
      const key = 'locale' + attr.replace(/[^a-z0-9]/gi, '_');
      document.querySelectorAll(`body *:not(script):not(style)[${attr}]`).forEach(node => {
        const zh = node.dataset[key] || node.getAttribute(attr) || '';
        const en = copy[zh] || fallback[zh];
        if (!en) return;
        if (!node.dataset[key]) node.dataset[key] = zh;
        node.setAttribute(attr, locale === 'en' ? en : node.dataset[key]);
      });
    });
  };
  const apply = next => {
    locale = next === 'en' ? 'en' : 'zh';
    localStorage.setItem(key, locale);
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    document.documentElement.dataset.locale = locale;
    if (titles[page]) document.title = titles[page][locale === 'en' ? 1 : 0];
    if (page === 'framework.html') {
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = locale === 'en'
        ? 'A visual portfolio tracing Yingge Dance through image, movement, and living heritage.'
        : 'NoiSee_Y 的个人视觉作品与英歌舞数字展陈记录。';
    }
    document.querySelectorAll('body *:not(script):not(style)').forEach(node => {
      if (node.children.length) return;
      const zh = node.dataset.localeZh || node.textContent.trim();
      const en = copy[zh];
      if (!en) return;
      if (!node.dataset.localeZh) node.dataset.localeZh = zh;
      node.textContent = locale === 'en' ? en : node.dataset.localeZh;
    });
    localizeAttributes();
    document.querySelectorAll('nav a').forEach(link => {
      const href = (link.getAttribute('href') || '').split('#')[0].split('/').pop() || 'index.html';
      const label = hrefLabels[href];
      if (label && !link.querySelector('strong')) setLocalized(link, label);
    });
    document.querySelectorAll('.museum-menu summary').forEach(node => setLocalized(node, 'Online exhibits'));
    document.querySelectorAll('.museum-menu-panel a strong').forEach(node => {
      const href = node.closest('a')?.getAttribute('href')?.split('/').pop() || '';
      const label = hrefLabels[href];
      if (label) setLocalized(node, label);
    });
    const brand = document.querySelector('.shell-brand strong,.spread-brand strong');
    if (brand) setLocalized(brand, 'Yingge Dance Digital Museum');
    const iframe = document.querySelector('#frameworkStage');
    if (iframe) {
      iframe.title = locale === 'en' ? 'Yingge themed gallery visual story' : '英歌舞专题展馆视觉叙事';
      if (!iframe.dataset.localeBound) {
        iframe.dataset.localeBound = 'true';
        iframe.addEventListener('load', () => {
          iframe.__yinggeLocaleObserver?.disconnect();
          iframe.__yinggeLocaleObserver = null;
          delete iframe.dataset.localeObserver;
          // The embedded visual page hydrates after its load event.  Delay the
          // first text replacement so React owns the initial DOM reconciliation.
          if (iframe.__yinggeLocaleTimer) clearTimeout(iframe.__yinggeLocaleTimer);
          iframe.__yinggeLocaleTimer = setTimeout(() => refreshIframe(iframe), 1100);
        });
      }
      if (iframe.dataset.localeObserver) refreshIframe(iframe);
    }
    const header = document.querySelector('.museum-shell-nav,.spread-nav');
    if (!header) return;
    let button = header.querySelector('.locale-toggle');
    if (!button) { button = document.createElement('button'); button.type = 'button'; button.className = 'locale-toggle'; header.appendChild(button); button.addEventListener('click', () => apply(locale === 'en' ? 'zh' : 'en')); }
    button.textContent = locale === 'en' ? '中文' : 'EN';
    button.setAttribute('aria-label', locale === 'en' ? '切换到中文' : 'Switch to English');
    button.title = button.getAttribute('aria-label');
    window.__frameworkShellRefresh?.();
  };
  window.yinggeLocaleShell = { get locale() { return locale; }, translate: text => locale === 'en' ? (copy[String(text)] || String(text)) : String(text), apply };
  // The standalone visual framework is a React export.  Let hydration finish
  // before replacing its text nodes, otherwise React can overwrite the copy
  // (or report a hydration mismatch) immediately after the first paint.
  if (page === 'framework.html') setTimeout(() => apply(locale), 900);
  else apply(locale);
})();

// Public-site ICP filing for pages using the framework/locale shell.
(()=>{
  if(document.querySelector('.site-icp-footer'))return;
  const footer=document.createElement('footer');
  footer.className='site-icp-footer';
  footer.setAttribute('aria-label','网站备案信息');
  footer.innerHTML='<span>© 2026 英歌舞数字博物馆</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026130280号-2</a>';
  const style=document.createElement('style');
  style.textContent='.site-icp-footer{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 18px;min-height:56px;padding:15px 20px;background:#0f1713;color:rgba(255,255,255,.68);font:12px/1.6 "Microsoft YaHei",sans-serif;text-align:center;border-top:1px solid rgba(255,255,255,.1)}.site-icp-footer a{color:rgba(255,255,255,.82);text-decoration:none}.site-icp-footer a:hover,.site-icp-footer a:focus{color:#fff;text-decoration:underline}@media(max-width:560px){.site-icp-footer{min-height:66px;gap:2px 12px;padding:13px 16px}.site-icp-footer span,.site-icp-footer a{width:100%}}';
  document.head.appendChild(style);
  document.body.appendChild(footer);
})();
