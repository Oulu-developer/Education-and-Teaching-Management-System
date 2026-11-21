/**
 * 时政热点服务：从人民网/新华网免费 RSS 抓取，懒加载缓存到 news 表（按日期）
 * 采用「请求时检查缓存」策略，实现「每日更新」体验，无需常驻定时任务。
 * 抓取失败时优雅降级为空列表，前端显示「今日暂无更新」。
 */
import { XMLParser } from 'fast-xml-parser';
import { from, run } from '../config/db.js';
import { config } from '../config/index.js';
import { todayStr } from '../utils/helpers.js';

/** 抓取并解析单个 RSS 源，返回标准化条目列表 */
async function fetchFeed(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const doc = new XMLParser({ ignoreAttributes: true, trimValues: true }).parse(xml);
  const rawItems = doc?.rss?.channel?.item ?? [];
  const items = (Array.isArray(rawItems) ? rawItems : [rawItems])
    .map((it) => ({
      title: String(it.title ?? '').trim(),
      summary: String(it.description ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 200),
      url: String(it.link ?? '').trim(),
    }))
    .filter((it) => it.title);
  return items;
}

/** 获取今日时政热点：命中缓存直接返回，否则抓取并缓存 */
export async function getTodayNews() {
  const today = todayStr();
  const cached = await run(
    from('news').select('*').eq('news_date', today).order('id', { ascending: true }),
    '查询新闻失败',
  );
  if (cached && cached.length) return cached;

  let items = [];
  for (const feed of config.newsFeeds) {
    try {
      const list = await fetchFeed(feed.url);
      items = list.slice(0, config.newsMaxItems).map((it) => ({ ...it, source: feed.name }));
      break;
    } catch (err) {
      console.warn(`[news] 抓取 ${feed.name} 失败：${err.message}`);
    }
  }

  if (items.length) {
    const rows = items.map((it) => ({
      title: it.title,
      summary: it.summary,
      source: it.source,
      url: it.url,
      news_date: today,
    }));
    await run(from('news').insert(rows).select('id'), '缓存新闻失败');
    return rows;
  }
  return [];
}
