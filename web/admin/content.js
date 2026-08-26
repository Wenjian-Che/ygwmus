(() => {
  const API = 'http://127.0.0.1:8787';
  const form = document.querySelector('#contentForm');
  const frame = document.querySelector('#previewFrame');
  const state = document.querySelector('#saveState');
  const fallback = {hero:{eyebrow:'国家级非物质文化遗产 英歌',titleLine1:'看见英歌，',titleLine2:'也看懂英歌。',body:'影像、互动与知识档案，共同解释动作、阵法、人物和地方传承。',primaryCta:'进入数字展馆'},experiences:{title:'三件核心展项',intro:'先看真实表演，再进互动叙事；遇到不懂的内容，随时问英歌小槌。',cards:{video:{title:'看英歌',description:'从完整表演进入动作、阵形、人物与地方现场。'},h5:{title:'互动特展',description:'沿着互动叙事认识英歌，并随时返回博物馆继续参观。'},agent:{title:'问小槌',description:'围绕当前展品回答，并说明资料来源和适用范围。'}}}};
  const field = name => form.querySelector(`[name="${name}"]`);
  const value = name => field(name)?.value || '';
  const set = (name, data) => { if (field(name)) field(name).value = name.split('.').reduce((target, part) => target?.[part], data) || ''; };
  const headers = () => { const token = sessionStorage.getItem('yingge-admin-token'); return {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}; };
  const readForm = () => ({version:1, hero:{eyebrow:value('hero.eyebrow'),titleLine1:value('hero.titleLine1'),titleLine2:value('hero.titleLine2'),body:value('hero.body'),primaryCta:value('hero.primaryCta')},experiences:{title:value('experiences.title'),intro:value('experiences.intro'),cards:{video:{title:value('experiences.cards.video.title'),description:value('experiences.cards.video.description')},h5:{title:value('experiences.cards.h5.title'),description:value('experiences.cards.h5.description')},agent:{title:value('experiences.cards.agent.title'),description:value('experiences.cards.agent.description')}}}});
  const fill = data => ['hero.eyebrow','hero.titleLine1','hero.titleLine2','hero.body','hero.primaryCta','experiences.title','experiences.intro','experiences.cards.video.title','experiences.cards.video.description','experiences.cards.h5.title','experiences.cards.h5.description','experiences.cards.agent.title','experiences.cards.agent.description'].forEach(name => set(name,data));
  const markDirty = () => { state.textContent = '有未保存修改'; state.classList.add('dirty'); };
  form.addEventListener('input', markDirty);
  async function load() { try { const response = await fetch(`${API}/api/admin/site-content`, {headers:headers()}); if (!response.ok) throw new Error('无法读取内容配置'); fill(await response.json()); } catch { try { const cached = JSON.parse(localStorage.getItem('yingge-site-content') || 'null'); fill(cached || fallback); } catch { fill(fallback); } } }
  document.querySelector('#save').addEventListener('click', async () => { const data = readForm(); state.textContent = '正在保存'; try { const response = await fetch(`${API}/api/admin/site-content`, {method:'PUT',headers:headers(),body:JSON.stringify(data)}); if (!response.ok) throw new Error('保存失败，请检查后台服务'); const saved = await response.json(); localStorage.setItem('yingge-site-content',JSON.stringify(saved)); fill(saved); state.textContent = '已保存并发布'; state.classList.remove('dirty'); frame.src = `../index.html?preview=${Date.now()}`; } catch (error) { localStorage.setItem('yingge-site-content',JSON.stringify(data)); state.textContent = '已保存本机草稿'; state.classList.add('dirty'); frame.src = `../index.html?preview=${Date.now()}`; alert(`${error.message}\n已保存在当前浏览器草稿中，后台服务恢复后可再次发布。`); } });
  document.querySelector('#preview').addEventListener('click', () => { frame.src = `../index.html?preview=${Date.now()}`; frame.scrollIntoView({behavior:'smooth',block:'center'}); });
  document.querySelectorAll('.page-link').forEach(button => button.addEventListener('click', () => { if (button.dataset.page !== 'home') alert('该页面已预留编辑入口，待对应内容模型接入后开放。当前先完成首页与核心三项展项。'); document.querySelectorAll('.page-link').forEach(item => item.classList.toggle('is-active',item === button)); }));
  load();
})();
