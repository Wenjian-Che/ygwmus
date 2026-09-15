(() => {
  const timeline = document.querySelector('#eventTimeline');
  const dialog = document.querySelector('#sourceDialog');
  const detail = document.querySelector('#sourceDetail');
  const boundary = document.querySelector('#boundaryText');
  const tr = value => window.yinggeLocaleShell?.translate(value) || String(value || '');
  const escapeHtml = value => String(value || '').replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  const safeMediaUrl = value => {
    const raw=String(value||'').trim();
    if (/^assets\/curation\/[A-Za-z0-9._/-]+$/.test(raw) && !raw.split('/').includes('..')) return raw;
    return safeUrl(raw);
  };
  const sourceTypeLabel = value => tr({government_institution:'政府或公共机构',media_report:'主流媒体报道',institution_page:'机构页面'}[value] || '公开来源');
  const formatDate = value => {
    const parts=String(value||'').split('/');
    const formatPart=part=>{const match=part.match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?`${Number(match[1])} 年 ${Number(match[2])} 月 ${Number(match[3])} 日`:part};
    if(window.yinggeLocaleShell?.locale==='en'){
      const formatEnglish=part=>{const date=new Date(`${part}T00:00:00Z`);return Number.isNaN(date.valueOf())?part:new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(date)};
      return parts.map(formatEnglish).join(' – ');
    }
    if(parts.length===2){const first=parts[0].match(/^(\d{4})-(\d{2})-(\d{2})$/),second=parts[1].match(/^(\d{4})-(\d{2})-(\d{2})$/);if(first&&second&&first[1]===second[1]&&first[2]===second[2])return `${Number(first[1])} 年 ${Number(first[2])} 月 ${Number(first[3])} 日至 ${Number(second[3])} 日`}
    return parts.map(formatPart).join('至');
  };
  const publicResearchNote = event => String(event.research_note||'')
    .replace(/；候选影像仍待公开授权。?/u,'。')
    .replace(/；候选影像仍待授权。?/u,'。')
    .replace(/；候选图含媒体截图及未成年人风险，只作内部核验参考。?/u,'。')
    .trim();
  const sourceCards = event => `<aside class="source-card" aria-label="${escapeHtml(tr('资料来源'))}"><span>${escapeHtml(tr('资料来源'))}</span>${(event.sources || []).map(source => { const href=safeUrl(source.url); return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.label)}</strong><small>${escapeHtml(sourceTypeLabel(source.source_type))}</small></a>` : ''; }).join('')}</aside>`;
  const storyMarkup = event => `<section class="event-story" aria-label="${escapeHtml(tr('这一场如何发生'))}"><h4>${escapeHtml(tr('这一场如何发生'))}</h4><ol><li><span>${escapeHtml(tr('参与主体'))}</span><p>${escapeHtml(tr(event.people_or_team))}</p></li><li><span>${escapeHtml(tr('公开事实'))}</span><p>${escapeHtml(tr(event.caption))}</p></li><li><span>${escapeHtml(tr('适用边界'))}</span><p>${escapeHtml(tr(event.curatorial_boundary || '本条只说明这次具体活动，不代表所有队伍的跨境传播方式。'))}</p></li></ol></section>`;
  const mediaMarkup = event => {
    const mediaUrls = (Array.isArray(event.media_urls) ? event.media_urls : [event.media_url])
      .map(safeMediaUrl)
      .filter((src, index, list) => src && list.indexOf(src) === index);
    return event.public_media && mediaUrls.length
      ? `<figure class="event-media${mediaUrls.length > 1 ? ' event-media-gallery' : ''}"><div class="event-media-track">${mediaUrls.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(tr(event.caption))} (${index + 1})" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div><figcaption>${escapeHtml(tr(event.caption))}</figcaption></figure>`
      : `<div class="event-media media-awaiting"><span>${escapeHtml(tr('本条以文字记录呈现'))}</span><p>${escapeHtml(tr('你仍可以通过活动信息和公开来源了解这次交流。'))}</p></div>`;
  };
  const render = payload => {
    const exhibit = payload.exhibits?.find(item => item.id === 'yingge-across-borders');
    if (!exhibit) throw new Error('没有找到跨国传播展厅数据');
    boundary.textContent = tr(exhibit.boundary_note);
    timeline.innerHTML = exhibit.events.map((event, index) => `
      <article class="event-entry" style="--order:${index}">
          <div class="event-date"><time datetime="${escapeHtml(event.date)}">${escapeHtml(formatDate(event.date))}</time><span>${escapeHtml(tr(event.location))}</span></div>
        ${mediaMarkup(event)}
        <div class="event-copy">
          <h3>${escapeHtml(tr(event.event_title))}</h3>
          <p>${escapeHtml(tr(event.audience_summary || event.caption))}</p>
          ${storyMarkup(event)}
          ${event.student_takeaway ? `<p class="event-takeaway"><span>${escapeHtml(tr('观察提示'))}</span>${escapeHtml(tr(event.student_takeaway))}</p>` : ''}
          <p class="event-team">${escapeHtml(tr('参与：'))}${escapeHtml(tr(event.people_or_team))}</p>
          ${event.curatorial_boundary ? `<p class="event-boundary">${escapeHtml(tr(event.curatorial_boundary))}</p>` : ''}
          ${publicResearchNote(event) ? `<details class="research-note"><summary>${escapeHtml(tr('研究注释'))}</summary><p>${escapeHtml(tr(publicResearchNote(event)))}</p></details>` : ''}
          ${sourceCards(event)}
          <button type="button" data-source="${escapeHtml(event.id)}">${escapeHtml(tr('查看来源与边界'))}</button>
        </div>
      </article>`).join('');
    // Event cards are rendered asynchronously; re-apply the selected locale
    // so source labels and evidence notes are translated after the fetch.
    window.yinggeLocaleShell?.apply(window.yinggeLocaleShell.locale);
    timeline.querySelectorAll('[data-source]').forEach(button => button.addEventListener('click', () => {
      const event = exhibit.events.find(item => item.id === button.dataset.source);
      detail.innerHTML = `<p class="dialog-label">${escapeHtml(tr('来源详情'))}</p><h2 id="sourceTitle">${escapeHtml(tr(event.event_title))}</h2><dl><div><dt>${escapeHtml(tr('时间'))}</dt><dd>${escapeHtml(formatDate(event.date))}</dd></div><div><dt>${escapeHtml(tr('地点'))}</dt><dd>${escapeHtml(tr(event.location))}</dd></div><div><dt>${escapeHtml(tr('参与队伍'))}</dt><dd>${escapeHtml(tr(event.people_or_team))}</dd></div><div><dt>${escapeHtml(tr('页面呈现'))}</dt><dd>${event.public_media ? escapeHtml(tr('现场图片与文字来源')) : escapeHtml(tr('文字记录与公开来源'))}</dd></div>${event.curatorial_boundary?`<div><dt>${escapeHtml(tr('适用边界'))}</dt><dd>${escapeHtml(tr(event.curatorial_boundary))}</dd></div>`:''}</dl><h3>${escapeHtml(tr('可点击来源'))}</h3><div class="dialog-sources">${event.sources.map(source => { const href=safeUrl(source.url); return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer"><span>${escapeHtml(sourceTypeLabel(source.source_type))}</span>${escapeHtml(source.label)}</a>` : ''; }).join('')}</div>`;
      dialog.showModal();
    }));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), {threshold: 0.18});
      timeline.querySelectorAll('.event-entry').forEach(item => observer.observe(item));
    } else timeline.querySelectorAll('.event-entry').forEach(item => item.classList.add('is-visible'));
  };
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  fetch('data/exhibits.public.json').then(response => {
    if (!response.ok) throw new Error('展厅数据暂时无法读取');
    return response.json();
  }).then(render).catch(error => { timeline.innerHTML = `<p class="error-state">${escapeHtml(error.message)}，请稍后再试。</p>`; });
})();
