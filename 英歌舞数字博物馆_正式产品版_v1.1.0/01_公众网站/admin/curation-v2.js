(() => {
  const API = window.CURATION_API || window.AdminShell?.apiBase || location.origin;
  const state = {catalog:null,summary:null,preview:null,audit:[],actor:null,private_media:{connected:false}};
  const privatePreviewUrls=new Map();
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label = value => ({draft:'草稿',pending_review:'待审',published:'已发布',publishable:'可发布',reviewed:'已审核',withdrawn:'已撤回',unverified:'未核验',verified:'已核验',rejected:'未通过',unreviewed:'未复核',approved:'已通过',pending_authorization:'待授权',authorized:'已授权',declined:'不可用',real_material:'真实内容',ip_placeholder:'IP 占位',interpretive_only:'解释性示意',source_review:'来源复核中',owner:'管理员',author:'编辑',reviewer:'审核',publisher:'发布'}[value] || value || '未知');
  const headers = () => { const token=sessionStorage.getItem('yingge-admin-token'); return {'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}; };
  const allEvents = () => (state.catalog?.exhibits || []).flatMap(exhibit => (exhibit.events || []).map(event => ({...event,exhibit_id:exhibit.id,exhibit_title:exhibit.title})));
  const mediaById = id => (state.catalog?.media_assets || []).find(item => item.id === id);
  const safeLink = value => { try { const url=new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };

  async function request(path, options={}) {
    const response = await fetch(`${API}${path}`, {...options,credentials:'include',headers:{...headers(),...(options.headers||{})}});
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `请求失败（${response.status}）`);
    return payload;
  }

  async function operate(operation, {id='',parent_id='',input={}}={}) {
    const payload = await request('/api/admin/curation/operations', {method:'POST',body:JSON.stringify({operation,id,parent_id,input,reason:`后台执行 ${operation}`})});
    state.catalog=payload.catalog; state.summary=payload.summary; state.preview=null; render();
    return payload.item;
  }

  function statusOptions(current, values) { return values.map(value => `<option value="${escapeHtml(value)}" ${value===current?'selected':''}>${escapeHtml(label(value))}</option>`).join(''); }
  function field(name, value, title, type='input', options=[]) {
    const content=escapeHtml(value);
    const control=type==='textarea'?`<textarea data-field="${name}" rows="3">${content}</textarea>`:type==='select'?`<select data-field="${name}">${options.map(option=>`<option value="${escapeHtml(option.value)}" ${option.value===value?'selected':''}>${escapeHtml(option.label)}</option>`).join('')}</select>`:`<input data-field="${name}" value="${content}">`;
    return `<label>${escapeHtml(title)}${control}</label>`;
  }

  function renderMetrics() {
    const items=[['章节',state.summary.exhibits?.total||0],['活动',state.summary.events?.total||0],['待授权媒体',state.summary.rights?.pending_authorization||0],['公开媒体',state.summary.public_media||0],['IP 占位页',(state.catalog.page_coverage||[]).filter(item=>item.content_status==='ip_placeholder').length]];
    $('#metrics').innerHTML=items.map(([name,value])=>`<div><strong>${value}</strong><span>${escapeHtml(name)}</span></div>`).join('');
  }

  function renderChapters() {
    $('#chapterList').innerHTML=(state.catalog.exhibits||[]).map((item,index,list)=>`<article class="chapter-card" data-id="${escapeHtml(item.id)}">
      <header><div><span class="record-id">${escapeHtml(item.id)}</span><h3>${escapeHtml(item.title)}</h3></div><span class="status" data-status="${escapeHtml(item.workflow_status)}">${escapeHtml(label(item.workflow_status))}</span></header>
      <div class="form-grid two">${field('title',item.title,'章节标题')}${field('summary',item.summary,'后台摘要','textarea')}${field('audience_summary',item.audience_summary,'公众导语','textarea')}${field('student_takeaway',item.student_takeaway,'学生带走什么','textarea')}${field('research_note',item.research_note,'研究注释','textarea')}${field('boundary_note',item.boundary_note,'适用边界','textarea')}</div>
      <div class="record-actions"><label class="compact">工作流<select data-field="workflow_status">${statusOptions(item.workflow_status,['draft','pending_review','published','withdrawn'])}</select></label><button data-action="save-exhibit">保存</button><button class="secondary" data-action="copy-exhibit">复制草稿</button><button class="ghost" data-action="move-exhibit" data-direction="-1" ${index===0?'disabled':''}>上移</button><button class="ghost" data-action="move-exhibit" data-direction="1" ${index===list.length-1?'disabled':''}>下移</button><button class="danger ghost" data-action="delete-exhibit">删除草稿</button></div>
    </article>`).join('') || '<p class="empty-state">尚无章节</p>';
  }

  function renderSources(event) {
    return `<div class="source-editor"><div class="subheading"><strong>资料来源</strong><button class="ghost" data-action="add-source">添加来源</button></div>${(event.sources||[]).map((source,index,list)=>{
      const href=safeLink(source.url);
      return `<div class="source-row" data-source-id="${escapeHtml(source.id)}"><div><strong>${escapeHtml(source.label)}</strong><small>${escapeHtml(source.source_type)}</small>${href?`<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">打开来源</a>`:''}</div><div class="mini-actions"><button class="ghost" data-action="edit-source">编辑</button><button class="ghost" data-action="move-source" data-direction="-1" ${index===0?'disabled':''}>↑</button><button class="ghost" data-action="move-source" data-direction="1" ${index===list.length-1?'disabled':''}>↓</button><button class="danger ghost" data-action="delete-source">删除</button></div></div>`;
    }).join('') || '<p class="micro-copy">尚未登记来源，活动不能发布。</p>'}</div>`;
  }

  function renderEvents() {
    $('#eventList').innerHTML=(state.catalog.exhibits||[]).flatMap(exhibit=>(exhibit.events||[]).map((rawEvent,index,list)=>{
      const event={...rawEvent,exhibit_id:exhibit.id,exhibit_title:exhibit.title};
      const media=mediaById(event.media_asset_id);
      return `<article class="event-card" data-id="${escapeHtml(event.id)}" data-parent="${escapeHtml(event.exhibit_id)}">
        <header><div><span class="record-id">${escapeHtml(event.exhibit_title)} / ${escapeHtml(event.id)}</span><h3>${escapeHtml(event.event_title)}</h3></div><span class="status" data-status="${escapeHtml(event.workflow_status)}">${escapeHtml(label(event.workflow_status))}</span></header>
        <div class="review-gates"><span>事实 <b data-ok="${event.fact_review_status==='verified'}">${escapeHtml(label(event.fact_review_status))}</b></span><span>来源 <b data-ok="${event.source_review_status==='verified'}">${escapeHtml(label(event.source_review_status))}</b></span><span>权利 <b data-ok="${media?.rights_status==='authorized'}">${escapeHtml(label(media?.rights_status||'未绑定'))}</b></span><span>隐私 <b data-ok="${media?.privacy_review_status==='approved'}">${escapeHtml(label(media?.privacy_review_status||'未绑定'))}</b></span><span>图片公开 <b data-ok="${Boolean(media?.public_media)}">${media?.public_media?'是':'否'}</b></span></div>
        <details><summary>编辑活动内容、来源与媒体</summary><div class="form-grid two">${field('event_title',event.event_title,'活动标题')}${field('date',event.date,'日期')}${field('location',event.location,'地点')}${field('people_or_team',event.people_or_team,'主体或队伍','textarea')}${field('caption',event.caption,'展览说明','textarea')}${field('audience_summary',event.audience_summary,'公众摘要','textarea')}${field('student_takeaway',event.student_takeaway,'学生带走什么','textarea')}${field('research_note',event.research_note,'研究注释','textarea')}</div>
          <div class="review-controls"><label>工作流<select data-field="workflow_status">${statusOptions(event.workflow_status,['draft','pending_review','published','withdrawn'])}</select></label><label>事实核验<select data-field="fact_review_status">${statusOptions(event.fact_review_status,['unverified','verified','rejected'])}</select></label><label>来源核验<select data-field="source_review_status">${statusOptions(event.source_review_status,['unverified','verified','rejected'])}</select></label><label class="check"><input type="checkbox" data-field="public_fact" ${event.public_fact?'checked':''}>事实可公开</label><label>绑定媒体<select data-field="media_asset_id"><option value="">不绑定</option>${(state.catalog.media_assets||[]).map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===event.media_asset_id?'selected':''}>${escapeHtml(item.label)}</option>`).join('')}</select></label></div>
          ${renderSources(event)}
        </details>
        <div class="record-actions"><button data-action="save-event">保存活动</button><button class="secondary" data-action="copy-event">复制草稿</button><button class="ghost" data-action="move-event" data-direction="-1" ${index===0?'disabled':''}>上移</button><button class="ghost" data-action="move-event" data-direction="1" ${index===list.length-1?'disabled':''}>下移</button><button class="danger ghost" data-action="delete-event">删除草稿</button></div>
      </article>`;
    })).join('') || '<p class="empty-state">尚无活动</p>';
  }

  function authorizationChecks(media) {
    const scope=String(media.license_scope||'').trim();
    const privacyApproved=media.privacy_review_status==='approved';
    const minorRisk=media.contains_minors===true;
    const thirdPartyRisk=media.contains_third_party_media===true;
    return [
      {label:'公开传播范围',ok:media.rights_status==='authorized'&&Boolean(String(media.rights_holder||'').trim())&&!/待确认/.test(String(media.rights_holder||'')),detail:media.rights_holder||'权利持有人未确认'},
      {label:'平台、期限与地域',ok:Boolean(scope)&&!/尚未|待确认/.test(scope),detail:scope||'授权范围未登记'},
      {label:'肖像',ok:privacyApproved,detail:privacyApproved?'隐私复核已通过':'肖像使用尚未通过复核'},
      {label:'未成年人',ok:!minorRisk||Boolean(String(media.minor_consent_evidence_ref||'').trim()),detail:minorRisk?(media.minor_consent_evidence_ref||'必须登记未成年人肖像同意凭证'):'未标记未成年人风险，仍需人工确认'},
      {label:'第三方媒体截图',ok:!thirdPartyRisk||Boolean(String(media.third_party_rights_evidence_ref||'').trim()),detail:thirdPartyRisk?(media.third_party_rights_evidence_ref||'必须登记第三方媒体截图权利凭证'):'未标记第三方媒体截图风险'},
      {label:'可撤回机制',ok:/撤回|终止|下架/.test(scope),detail:/撤回|终止|下架/.test(scope)?'授权范围已记录撤回或终止安排':'授权凭证中尚未记录撤回机制'},
      {label:'审核意见',ok:Boolean(String(media.review_note||'').trim()),detail:media.review_note||'审核员尚未记录判断依据'},
    ];
  }

  function mediaGateReasons(media) {
    const checks=authorizationChecks(media);
    const reasons=[];
    if(media.rights_status!=='authorized')reasons.push('权利未授权');
    if(media.privacy_review_status!=='approved')reasons.push('隐私未通过');
    if(!String(media.public_url||'').trim())reasons.push('未配置安全公开地址');
    if(!String(media.authorization_evidence_ref||'').trim())reasons.push('未登记授权凭证');
    if(!String(media.review_note||'').trim())reasons.push('未填写审核意见');
    if(checks.some(item=>!item.ok))reasons.push('授权核验清单未全部满足');
    return [...new Set(reasons)];
  }

  async function loadPrivatePreviews() {
    for(const url of privatePreviewUrls.values())URL.revokeObjectURL(url);
    privatePreviewUrls.clear();
    if(!state.private_media?.connected)return;
    await Promise.all($$('[data-media-preview]').map(async image=>{
      const card=image.closest('.media-card'); const status=$('[data-private-status]',card); const id=image.dataset.mediaPreview;
      try{
        const response=await fetch(`${API}/api/admin/curation/media/${encodeURIComponent(id)}/preview`,{credentials:'include',headers:headers(),cache:'no-store'});
        if(!response.ok){const payload=await response.json().catch(()=>({}));throw new Error(payload.message||`预览失败（${response.status}）`);}
        const blob=await response.blob(); const url=URL.createObjectURL(blob); privatePreviewUrls.set(id,url); image.src=url; image.hidden=false; status.textContent='仅供后台核验，不代表已授权公开';
      }catch(error){image.hidden=true;status.textContent=error.message;}
    }));
  }

  function renderAssets() {
    $('#assetList').innerHTML=(state.catalog.media_assets||[]).map((media,index,list)=>{const bindings=allEvents().filter(event=>event.media_asset_id===media.id);const checks=authorizationChecks(media);const gateReasons=mediaGateReasons(media);const highRisk=media.contains_minors===true||media.contains_third_party_media===true;const workflow=media.review_workflow||{stage:'pending_authorization',public_version:Number(media.published_version||0),steps:[{key:'pending_authorization',label:'待授权',complete:true},{key:'authorized',label:'已获授权',complete:false},{key:'reviewed',label:'已审核',complete:false},{key:'publishable',label:'可发布',complete:false}]};const binding=workflow.binding||bindings[0]||null;return `<article class="media-card" data-id="${escapeHtml(media.id)}"><header><div><span class="record-id">${escapeHtml(media.id)}</span><h3>${escapeHtml(media.label)}</h3></div><span class="status" data-status="${escapeHtml(workflow.stage)}">${escapeHtml(label(workflow.stage))}</span></header>
      <ol class="media-review-flow" aria-label="媒体授权审阅流程">${workflow.steps.map(step=>`<li data-state="${step.key===workflow.stage?'current':step.complete?'complete':'pending'}"><span>${escapeHtml(step.label)}</span><small>${step.key===workflow.stage?'当前阶段':step.complete?'已完成':'尚未进入'}</small></li>`).join('')}</ol>
      <div class="media-evidence-layout"><figure class="private-media-preview">${state.private_media?.connected?`<img data-media-preview="${escapeHtml(media.id)}" alt="${escapeHtml(media.label)}的后台候选预览" hidden>`:''}<figcaption data-private-status>${state.private_media?.connected?'正在安全读取候选缩略图':'私有候选库未连接'}</figcaption></figure><div class="review-dossier"><section><h4>素材与活动</h4><dl class="media-evidence"><div><dt>来源材料</dt><dd>${escapeHtml(media.source_document||'未登记')}</dd></div><div><dt>图片锚点</dt><dd>${escapeHtml(media.source_paragraph||'未登记')}</dd></div><div><dt>活动与时间</dt><dd>${binding?`${escapeHtml(binding.event_title)}<br>${escapeHtml(binding.date)}`:'尚未绑定活动'}</dd></div><div><dt>主体</dt><dd>${binding?escapeHtml(binding.people_or_team):'尚未登记'}</dd></div><div><dt>SHA-256</dt><dd><code>${escapeHtml(media.sha256||'未登记')}</code></dd></div><div><dt>支持主张</dt><dd>${escapeHtml(media.supported_claim||'未登记')}</dd></div></dl></section><section><h4>授权核验</h4><dl class="media-evidence"><div><dt>权利持有人</dt><dd>${escapeHtml(media.rights_holder||'待确认')}</dd></div><div><dt>许可范围</dt><dd>${escapeHtml(media.license_scope||'尚未取得公开传播授权')}</dd></div><div><dt>授权凭证</dt><dd>${escapeHtml(media.authorization_evidence_ref||'未登记')}</dd></div><div><dt>公开版本</dt><dd>${workflow.public_version?`v${escapeHtml(workflow.public_version)}`:'尚未发布图片'}</dd></div></dl></section></div></div>
      <div class="media-meta"><span>${escapeHtml(media.dimensions)}</span><span>${escapeHtml(media.inventory_ref)}</span><span>SHA ${escapeHtml(String(media.sha256||'').slice(0,12))}</span></div>
      <div class="review-controls"><label>权利状态<select data-field="rights_status">${statusOptions(media.rights_status,['pending_authorization','authorized','declined'])}</select></label><label>隐私复核<select data-field="privacy_review_status">${statusOptions(media.privacy_review_status,['unreviewed','approved','rejected'])}</select></label>${field('privacy_risk',media.privacy_risk,'风险说明')}<label class="check"><input type="checkbox" data-field="contains_minors" ${media.contains_minors?'checked':''}>涉及未成年人</label><label class="check"><input type="checkbox" data-field="contains_third_party_media" ${media.contains_third_party_media?'checked':''}>含第三方媒体内容</label><label class="check"><input type="checkbox" data-field="public_media" ${media.public_media?'checked':''}>允许图片公开</label></div>
      <section class="authorization-checklist"><h4>隐私复核与公开条件</h4>${highRisk?'<p class="risk-warning">高风险素材需要分别核对未成年人肖像同意与第三方媒体截图使用权。缺少任一专项凭证都不能公开。</p>':''}<ul>${checks.map(item=>`<li data-ok="${item.ok}"><strong>${escapeHtml(item.label)}</strong><b>${item.ok?'已满足':'未满足'}</b><span>${escapeHtml(item.detail)}</span></li>`).join('')}</ul><p data-media-gate>${gateReasons.length?`当前不可公开：${escapeHtml(gateReasons.join('；'))}`:'审核字段已齐备。仍须由发布者确认公众快照。'}</p></section>
      <details><summary>编辑来源、授权与审核记录</summary><div class="form-grid two">${field('label',media.label,'媒体名称')}${field('inventory_ref',media.inventory_ref,'候选库相对引用')}${field('dimensions',media.dimensions,'尺寸')}${field('public_url',media.public_url,'安全公开地址')}${field('source_document',media.source_document,'来源文档相对引用')}${field('source_paragraph',media.source_paragraph,'来源段落')}${field('publication',media.publication,'发布机构')}${field('accessed_at',media.accessed_at,'访问日期')}${field('supported_claim',media.supported_claim,'支持主张','textarea')}${field('rights_holder',media.rights_holder,'权利人')}${field('license_scope',media.license_scope,'授权范围','textarea')}${field('authorization_evidence_ref',media.authorization_evidence_ref,'通用授权凭证相对引用')}${field('minor_consent_evidence_ref',media.minor_consent_evidence_ref,'未成年人肖像同意凭证')}${field('third_party_rights_evidence_ref',media.third_party_rights_evidence_ref,'第三方截图权利凭证')}${field('review_note',media.review_note,'审核意见','textarea')}${field('reviewer',media.reviewer,'复核人')}${field('reviewed_at',media.reviewed_at,'复核时间')}${field('expires_at',media.expires_at,'授权到期日')}</div></details>
      <div class="record-actions"><button data-action="save-media">保存审核</button><button class="ghost" data-action="move-media" data-direction="-1" ${index===0?'disabled':''}>上移</button><button class="ghost" data-action="move-media" data-direction="1" ${index===list.length-1?'disabled':''}>下移</button><button class="danger ghost" data-action="delete-media">删除未用候选</button></div></article>`;}).join('') || '<p class="empty-state">尚无媒体候选</p>';
  }

  function renderCoverage() { $('#coverageList').innerHTML=(state.catalog.page_coverage||[]).map(item=>`<article><div><strong>${escapeHtml(item.label)}</strong><code>${escapeHtml(item.page)}</code></div><span data-status="${escapeHtml(item.content_status)}">${escapeHtml(label(item.content_status))}</span><p>${escapeHtml(item.note)}</p></article>`).join(''); }

  function displayValue(value) {
    if (value === null || value === undefined || value === '') return '（空）';
    if (Array.isArray(value)) return value.join('、') || '（空）';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function renderFieldDiff(details={}) {
    return Object.entries(details.fields || {}).map(([name,change])=>`<div class="field-diff"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(displayValue(change.before))}</span><i aria-hidden="true">→</i><span>${escapeHtml(displayValue(change.after))}</span></div>`).join('');
  }

  function renderReviewContext(context={}) {
    const eventEntries=Object.entries(context.events || {});
    const mediaEntries=Object.entries(context.media || {});
    if (!eventEntries.length && !mediaEntries.length) return '';
    return `<section class="review-context"><h3>本轮复核依据</h3>${eventEntries.map(([id,item])=>`<article><span class="record-id">${escapeHtml(id)}</span><dl><div><dt>日期 / 地点</dt><dd>${escapeHtml(item.date)} · ${escapeHtml(item.location)}</dd></div><div><dt>主体</dt><dd>${escapeHtml(item.people_or_team)}</dd></div><div><dt>说明</dt><dd>${escapeHtml(item.caption)}</dd></div><div><dt>边界</dt><dd>${escapeHtml(item.boundary_note || '未填写')}</dd></div></dl><h4>来源与支持主张</h4>${(item.sources||[]).map(source=>{const href=safeLink(source.url);return `<div class="review-source"><strong>${escapeHtml(source.label)}</strong><span>${escapeHtml(source.source_type)}</span><p>${escapeHtml(source.supported_claim || '未登记支持主张')}</p>${href?`<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">核对来源</a>`:''}</div>`;}).join('') || '<p class="micro-copy">尚无可复核来源</p>'}</article>`).join('')}${mediaEntries.map(([id,item])=>`<article><span class="record-id">媒体 ${escapeHtml(id)}</span><dl><div><dt>公开地址</dt><dd>${escapeHtml(item.public_url || '未设置')}</dd></div><div><dt>权利 / 隐私</dt><dd>${escapeHtml(label(item.rights_status))} · ${escapeHtml(label(item.privacy_review_status))}</dd></div></dl></article>`).join('')}</section>`;
  }

  function renderAudit() {
    const root=$('#auditList'); if(!root)return;
    root.innerHTML=(state.audit||[]).map(entry=>`<article><header><div><strong>${escapeHtml(entry.operation)}</strong><span>${escapeHtml(entry.object_type)} / ${escapeHtml(entry.object_id)}</span></div><time>${escapeHtml(entry.timestamp)}</time></header><p>${escapeHtml(entry.reason || '未填写原因')}</p><div class="audit-meta"><span>${escapeHtml(entry.actor?.role || 'system')}</span><span>${escapeHtml(entry.actor?.id || 'system')}</span><span>目录 v${escapeHtml(entry.catalog_version)}</span>${entry.decision?`<span>${escapeHtml(entry.decision)}</span>`:''}</div>${renderFieldDiff({fields:entry.field_diff||{}})}</article>`).join('') || '<p class="empty-state">尚无策展操作记录</p>';
  }

  function applyRoleAccess() {
    const role=state.actor?.role;
    if (!role) return;
    if (role==='publisher') {
      $$('[data-action],#newExhibit,#newEvent,#newMedia').forEach(control=>{control.disabled=true;});
      $$('[data-field]').forEach(control=>{control.disabled=true;});
      return;
    }
    if (role==='reviewer') {
      $$('[data-action],#newExhibit,#newEvent,#newMedia').forEach(control=>{control.disabled=true;});
      $$('[data-action="save-exhibit"],[data-action="save-event"],[data-action="save-media"]').forEach(control=>{control.disabled=false;});
      $$('[data-field]').forEach(control=>{control.disabled=true;});
      $$('.chapter-card [data-field="workflow_status"],.event-card [data-field="workflow_status"],.event-card [data-field="fact_review_status"],.event-card [data-field="source_review_status"],.event-card [data-field="public_fact"],.media-card [data-field="rights_status"],.media-card [data-field="privacy_review_status"],.media-card [data-field="privacy_risk"],.media-card [data-field="contains_minors"],.media-card [data-field="contains_third_party_media"],.media-card [data-field="public_media"],.media-card [data-field="license_scope"],.media-card [data-field="authorization_evidence_ref"],.media-card [data-field="minor_consent_evidence_ref"],.media-card [data-field="third_party_rights_evidence_ref"],.media-card [data-field="review_note"],.media-card [data-field="expires_at"]').forEach(control=>{control.disabled=false;});
      return;
    }
    $$('.event-card [data-field="fact_review_status"],.event-card [data-field="source_review_status"],.event-card [data-field="public_fact"],.media-card [data-field="rights_status"],.media-card [data-field="privacy_review_status"],.media-card [data-field="privacy_risk"],.media-card [data-field="contains_minors"],.media-card [data-field="contains_third_party_media"],.media-card [data-field="public_media"],.media-card [data-field="reviewer"],.media-card [data-field="reviewed_at"]').forEach(control=>{control.disabled=true;});
  }

  function updateMediaGateCard(card) {
    const original=mediaById(card.dataset.id)||{};
    const draft={...original,rights_status:$('[data-field="rights_status"]',card)?.value||original.rights_status,privacy_review_status:$('[data-field="privacy_review_status"]',card)?.value||original.privacy_review_status,privacy_risk:$('[data-field="privacy_risk"]',card)?.value||original.privacy_risk,contains_minors:$('[data-field="contains_minors"]',card)?.checked===true,contains_third_party_media:$('[data-field="contains_third_party_media"]',card)?.checked===true,public_url:$('[data-field="public_url"]',card)?.value||original.public_url,rights_holder:$('[data-field="rights_holder"]',card)?.value||original.rights_holder,license_scope:$('[data-field="license_scope"]',card)?.value||original.license_scope,authorization_evidence_ref:$('[data-field="authorization_evidence_ref"]',card)?.value||original.authorization_evidence_ref,minor_consent_evidence_ref:$('[data-field="minor_consent_evidence_ref"]',card)?.value||original.minor_consent_evidence_ref,third_party_rights_evidence_ref:$('[data-field="third_party_rights_evidence_ref"]',card)?.value||original.third_party_rights_evidence_ref,review_note:$('[data-field="review_note"]',card)?.value||original.review_note,expires_at:$('[data-field="expires_at"]',card)?.value||original.expires_at};
    const reasons=mediaGateReasons(draft); const checkbox=$('[data-field="public_media"]',card); const status=$('[data-media-gate]',card);
    if(checkbox)checkbox.disabled=state.actor?.role!=='reviewer'||reasons.length>0;
    if(status)status.textContent=reasons.length?`当前不可公开：${reasons.join('；')}`:'审核字段已齐备；勾选后由服务端记录审核人与时间，之后仍须发布者确认公众快照。';
  }

  function renderPreview() {
    if (!state.preview) { $('#previewContent').hidden=true; $('#confirmPublish').disabled=true; return; }
    const changeGroups=['exhibits','events'].flatMap(type=>['added','modified','removed'].map(kind=>({type,kind,ids:state.preview.changes[type][kind],details:state.preview.changes[type].details||{}})));
    $('#previewChanges').innerHTML=changeGroups.map(group=>`<div><strong>${group.ids.length}</strong><span>${group.type==='exhibits'?'章节':'活动'} · ${{added:'新增',modified:'修改',removed:'撤下'}[group.kind]}</span>${group.ids.map(id=>`<section><code>${escapeHtml(id)}</code>${renderFieldDiff(group.details[id])}</section>`).join('')}</div>`).join('')+renderReviewContext(state.preview.review_context);
    $('#previewContent').hidden=false;
    $('#previewContent').innerHTML=(state.preview.projection.exhibits||[]).map(exhibit=>`<article><span class="record-id">公众投影</span><h3>${escapeHtml(exhibit.title)}</h3><p>${escapeHtml(exhibit.audience_summary)}</p><strong>${escapeHtml(exhibit.student_takeaway)}</strong><details><summary>研究注释</summary><p>${escapeHtml(exhibit.research_note)}</p></details><ol>${(exhibit.events||[]).map(event=>`<li><b>${escapeHtml(event.event_title)}</b><span>${escapeHtml(event.audience_summary)}</span><small>${event.public_media?'含已授权图片':'仅发布文字事实'}</small></li>`).join('')}</ol></article>`).join('') || '<p class="empty-state">本次公众投影为空</p>';
    $('#confirmPublish').disabled=!['publisher','owner'].includes(state.actor?.role);
  }

  function render() { renderMetrics();renderChapters();renderEvents();renderAssets();renderCoverage();renderPreview();renderAudit();applyRoleAccess();$$('.media-card').forEach(updateMediaGateCard);loadPrivatePreviews(); }

  async function load() {
    $('#connectionState').textContent='正在读取';
    try { const [payload,auditPayload,sessionPayload]=await Promise.all([request('/api/admin/curation'),request('/api/admin/curation/audit'),request('/api/admin/session')]); Object.assign(state,payload,{preview:null,audit:auditPayload.entries||auditPayload.items||[],actor:sessionPayload.actor||null}); render(); $('#connectionState').textContent=state.actor?`已连接 · ${label(state.actor.role)}`:'已连接'; }
    catch(error) { $('#connectionState').textContent=error.message; $('#eventList').innerHTML=`<p class="empty-state">${escapeHtml(error.message)}</p>`; }
  }

  function collect(root, names) { return Object.fromEntries(names.map(name=>[name,$(`[data-field="${name}"]`,root)?.value.trim() ?? ''])); }
  function swap(ids,index,direction) { const target=index+direction; if(target<0||target>=ids.length)return ids; [ids[index],ids[target]]=[ids[target],ids[index]]; return ids; }

  async function handleClick(event) {
    const button=event.target.closest('[data-action]'); if(!button)return;
    const action=button.dataset.action; const eventCard=button.closest('.event-card'); const chapter=button.closest('.chapter-card'); const mediaCard=button.closest('.media-card');
    try {
      if(action==='save-exhibit') { const item=state.catalog.exhibits.find(x=>x.id===chapter.dataset.id); const workflow_status=$('[data-field="workflow_status"]',chapter).value; const input=state.actor?.role==='reviewer'?{expected_version:item.version,workflow_status}:{expected_version:item.version,...collect(chapter,['title','summary','audience_summary','student_takeaway','research_note','boundary_note']),...(workflow_status!=='published'?{workflow_status}:{})}; await operate('update_exhibit',{id:item.id,input}); }
      if(action==='copy-exhibit') { const item=state.catalog.exhibits.find(x=>x.id===chapter.dataset.id); await operate('copy_exhibit',{id:item.id,input:{expected_version:item.version}}); }
      if(action==='delete-exhibit') { const item=state.catalog.exhibits.find(x=>x.id===chapter.dataset.id); await operate('delete_exhibit',{id:item.id,input:{expected_version:item.version}}); }
      if(action==='move-exhibit') { const ids=state.catalog.exhibits.map(x=>x.id); await operate('reorder_exhibits',{input:{expected_version:state.catalog.version,ids:swap(ids,ids.indexOf(chapter.dataset.id),Number(button.dataset.direction))}}); }
      if(action==='save-event') { const item=allEvents().find(x=>x.id===eventCard.dataset.id); const workflow_status=$('[data-field="workflow_status"]',eventCard).value; if(state.actor?.role!=='reviewer'){const mediaId=$('[data-field="media_asset_id"]',eventCard).value||null;if(mediaId!==item.media_asset_id){const bound=await operate('bind_media',{parent_id:item.id,input:{expected_version:item.version,media_asset_id:mediaId}});item.version=bound.version;}} const input=state.actor?.role==='reviewer'?{expected_version:item.version,workflow_status,fact_review_status:$('[data-field="fact_review_status"]',eventCard).value,source_review_status:$('[data-field="source_review_status"]',eventCard).value,public_fact:$('[data-field="public_fact"]',eventCard).checked}:{expected_version:item.version,...collect(eventCard,['event_title','date','location','people_or_team','caption','audience_summary','student_takeaway','research_note']),...(workflow_status!=='published'?{workflow_status}:{})}; await operate('update_event',{id:item.id,input}); }
      if(action==='copy-event') { const item=allEvents().find(x=>x.id===eventCard.dataset.id); await operate('copy_event',{id:item.id,input:{expected_version:item.version}}); }
      if(action==='delete-event') { const item=allEvents().find(x=>x.id===eventCard.dataset.id); await operate('delete_event',{id:item.id,input:{expected_version:item.version}}); }
      if(action==='move-event') { const exhibit=state.catalog.exhibits.find(x=>x.id===eventCard.dataset.parent); const ids=exhibit.events.map(x=>x.id); await operate('reorder_events',{parent_id:exhibit.id,input:{expected_version:exhibit.version,ids:swap(ids,ids.indexOf(eventCard.dataset.id),Number(button.dataset.direction))}}); }
      if(action==='add-source') await sourceDialog(eventCard.dataset.id);
      if(action==='edit-source') { const sourceRow=button.closest('.source-row'); const item=allEvents().find(x=>x.id===eventCard.dataset.id).sources.find(x=>x.id===sourceRow.dataset.sourceId); await sourceDialog(eventCard.dataset.id,item); }
      if(action==='delete-source') { const sourceRow=button.closest('.source-row'); const item=allEvents().find(x=>x.id===eventCard.dataset.id).sources.find(x=>x.id===sourceRow.dataset.sourceId); await operate('delete_source',{id:item.id,input:{expected_version:item.version}}); }
      if(action==='move-source') { const item=allEvents().find(x=>x.id===eventCard.dataset.id); const sourceId=button.closest('.source-row').dataset.sourceId; const ids=item.sources.map(x=>x.id); await operate('reorder_sources',{parent_id:item.id,input:{expected_version:item.version,ids:swap(ids,ids.indexOf(sourceId),Number(button.dataset.direction))}}); }
      if(action==='save-media') { const item=state.catalog.media_assets.find(x=>x.id===mediaCard.dataset.id); const reviewFields=['license_scope','authorization_evidence_ref','minor_consent_evidence_ref','third_party_rights_evidence_ref','review_note','expires_at']; const input=state.actor?.role==='reviewer'?{expected_version:item.version,privacy_risk:$('[data-field="privacy_risk"]',mediaCard).value.trim(),contains_minors:$('[data-field="contains_minors"]',mediaCard).checked,contains_third_party_media:$('[data-field="contains_third_party_media"]',mediaCard).checked,rights_status:$('[data-field="rights_status"]',mediaCard).value,privacy_review_status:$('[data-field="privacy_review_status"]',mediaCard).value,public_media:$('[data-field="public_media"]',mediaCard).checked,...collect(mediaCard,reviewFields)}:{expected_version:item.version,...collect(mediaCard,['label','inventory_ref','dimensions','public_url','source_document','source_paragraph','publication','accessed_at','supported_claim','rights_holder',...reviewFields])}; await operate('update_media',{id:item.id,input}); }
      if(action==='delete-media') { const item=state.catalog.media_assets.find(x=>x.id===mediaCard.dataset.id); await operate('delete_media',{id:item.id,input:{expected_version:item.version}}); }
      if(action==='move-media') { const ids=state.catalog.media_assets.map(x=>x.id); await operate('reorder_media',{input:{expected_version:state.catalog.version,ids:swap(ids,ids.indexOf(mediaCard.dataset.id),Number(button.dataset.direction))}}); }
    } catch(error) { showNotice(error.message,'error'); }
  }

  async function sourceDialog(eventId, source=null) {
    const eventItem=allEvents().find(x=>x.id===eventId); const values=await modal(source?'编辑来源':'添加来源',[['label','来源名称',source?.label||''],['url','HTTPS 来源地址',source?.url||''],['source_type','来源类型',source?.source_type||'government_institution'],['supported_claim','该来源支持的具体主张',source?.supported_claim||'','textarea'],['source_document','内部来源文档相对引用',source?.source_document||''],['source_paragraph','来源段落',source?.source_paragraph||''],['publication','发布机构',source?.publication||''],['accessed_at','访问日期',source?.accessed_at||'']]); if(!values)return;
    if(source) await operate('update_source',{id:source.id,input:{expected_version:source.version,...values}});
    else await operate('add_source',{parent_id:eventId,input:{expected_version:eventItem.version,...values}});
  }

  function modal(title, fields) {
    return new Promise(resolve=>{
      const dialog=document.createElement('dialog'); dialog.className='record-dialog'; dialog.innerHTML=`<form method="dialog"><h2>${escapeHtml(title)}</h2>${fields.map(([name,labelText,value,type='input',options=[]])=>field(name,value,labelText,type,options)).join('')}<div class="record-actions"><button value="cancel" class="secondary">取消</button><button value="confirm">确认</button></div></form>`; document.body.append(dialog); dialog.addEventListener('close',()=>{ const result=dialog.returnValue==='confirm'?collect(dialog,fields.map(x=>x[0])):null; dialog.remove(); resolve(result); }); dialog.showModal();
    });
  }

  function showNotice(message,type='ok') { let notice=$('#opsNotice'); if(!notice){notice=document.createElement('div');notice.id='opsNotice';notice.className='ops-notice';document.body.append(notice);} notice.dataset.type=type;notice.textContent=message;notice.hidden=false;setTimeout(()=>{notice.hidden=true;},2600); }

  $('#newExhibit').addEventListener('click',async()=>{ const values=await modal('新增草稿章节',[['title','章节标题',''],['audience_summary','公众导语',''],['student_takeaway','学生带走什么','']]); if(values) operate('create_exhibit',{input:{expected_version:state.catalog.version,...values}}).catch(error=>showNotice(error.message,'error')); });
  $('#newEvent').addEventListener('click',async()=>{ if(!state.catalog.exhibits.length)return showNotice('请先建立章节','error'); const chapterOptions=state.catalog.exhibits.map(item=>({value:item.id,label:item.title})); const values=await modal('新增草稿活动',[['exhibit_id','所属章节',chapterOptions[0].value,'select',chapterOptions],['event_title','活动标题',''],['date','日期',''],['location','地点','']]); if(values){const exhibit=state.catalog.exhibits.find(item=>item.id===values.exhibit_id);delete values.exhibit_id;operate('create_event',{parent_id:exhibit.id,input:{expected_version:exhibit.version,...values}}).catch(error=>showNotice(error.message,'error'));} });
  $('#newMedia').addEventListener('click',async()=>{ const values=await modal('登记媒体候选',[['label','媒体名称',''],['inventory_ref','候选库相对引用',''],['dimensions','尺寸（宽x高）',''],['sha256','SHA-256','']]); if(values) operate('create_media',{input:{expected_version:state.catalog.version,...values}}).catch(error=>showNotice(error.message,'error')); });
  $('#loadPreview').addEventListener('click',async()=>{ try{state.preview=await request('/api/admin/curation/preview');renderPreview();}catch(error){showNotice(error.message,'error');} });
  $('#confirmPublish').addEventListener('click',async()=>{ try{const result=await request('/api/admin/curation/publish',{method:'POST',body:JSON.stringify({expected_version:state.preview.catalog_version,reason:'后台确认发布公众快照'})});state.preview=result;renderPreview();showNotice('公众快照已更新');}catch(error){showNotice(error.message,'error');} });
  $('#refresh').addEventListener('click',load);
  document.addEventListener('click',handleClick);
  document.addEventListener('input',event=>{const card=event.target.closest('.media-card');if(card)updateMediaGateCard(card);});
  load();
})();
