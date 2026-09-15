const START_AT = Date.parse('2026-09-16T00:00:00+08:00');
const END_AT = Date.parse('2026-09-22T23:59:59.999+08:00');
const REGION_TERMS = /潮汕地区|广东省|潮阳区|潮南区|普宁市|汕头市|揭阳市|潮州市|潮汕|潮阳|潮南|普宁|汕头|揭阳|潮州/gu;

export function regionRedactionActive(now = new Date()) {
  const time = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return Number.isFinite(time) && time >= START_AT && time <= END_AT;
}

export function redactPublicRegions(text, now = new Date()) {
  if (!regionRedactionActive(now)) return String(text || '');
  return String(text || '').replace(REGION_TERMS, term => term === '广东省' ? '某省' : '某地区');
}

export function createRegionStreamRedactor(now = new Date()) {
  const active = regionRedactionActive(now);
  let pending = '';
  return {
    push(chunk = '') {
      if (!active) return String(chunk || '');
      pending += String(chunk || '');
      const matches = [...pending.matchAll(/[。！？；\n]/gu)];
      const naturalEnd = matches.length ? (matches.at(-1).index + 1) : 0;
      const forcedEnd = pending.length > 120 ? pending.length - 24 : 0;
      const end = Math.max(naturalEnd, forcedEnd);
      if (!end) return '';
      const ready = pending.slice(0, end);
      pending = pending.slice(end);
      return redactPublicRegions(ready, now);
    },
    flush() {
      const ready = redactPublicRegions(pending, now);
      pending = '';
      return ready;
    }
  };
}
