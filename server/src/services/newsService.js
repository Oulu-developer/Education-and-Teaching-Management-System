/**
 * 新闻热点服务：多源抓取（国内要闻/国际/学术科技/政治），懒加载缓存到 news 表（按日期）
 * 采用「请求时检查缓存」策略，实现「每日更新」体验，无需常驻定时任务。
 * 每个源独立抓取、失败跳过，多个源结果合并；新浪源带图片，RSS 源提正文摘要。
 */
import { XMLParser } from 'fast-xml-parser';
import { from, run } from '../config/db.js';
import { config } from '../config/index.js';
import { todayStr } from '../utils/helpers.js';

/** 从 RSS description 或文本中提取首张图片 URL（无则空串） */
function extractImage(text) {
  if (!text) return '';
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(text) || /<enclosure[^>]+url=["']([^"']+)["']/i.exec(text);
  return m ? m[1] : '';
}

/** 抓取并解析单个 RSS 源，返回标准化条目列表 */
async function fetchRss(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const doc = new XMLParser({ ignoreAttributes: false, trimValues: true, attributeNamePrefix: '@_' }).parse(xml);
  const rawItems = doc?.rss?.channel?.item ?? [];
  return (Array.isArray(rawItems) ? rawItems : [rawItems])
    .map((it) => {
      const desc = String(it.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        title: String(it.title ?? '').trim(),
        summary: desc.slice(0, 160),
        url: String(it.link ?? '').trim(),
        image: extractImage(String(it.description ?? '')),
      };
    })
    .filter((it) => it.title);
}

/** 抓取新浪滚动新闻 JSON 接口（带图片），返回标准化条目列表 */
async function fetchSina(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const list = json?.result?.data ?? [];
  return (Array.isArray(list) ? list : [])
    .map((it) => {
      // 优先取内容图；跳过 100x100 的默认占位图与极窄 banner 图
      const imgs = Array.isArray(it.images) ? it.images : [];
      let image = imgs[0]?.u || (it.img && Number(it.img.w) > 200 ? it.img.u : '');
      if (image && !/^https?:/i.test(image)) image = 'https:' + image;
      return {
        title: String(it.title ?? '').trim(),
        summary: String(it.intro ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
        url: String(it.url ?? '').trim(),
        image,
      };
    })
    .filter((it) => it.title);
}

/** 获取今日新闻：命中缓存直接返回，否则多源抓取合并缓存 */
export async function getTodayNews() {
  const today = todayStr();
  const cached = await run(
    from('news').select('*').eq('news_date', today).order('id', { ascending: true }),
    '查询新闻失败',
  );
  if (cached && cached.length) return cached;

  const collected = [];
  const seen = new Set();
  // 每个源限取条数，保证「要闻/国际/学术/政治」多分类均衡，而不是被单一源占满
  const perSource = Math.max(5, Math.ceil(config.newsMaxItems / config.newsFeeds.length));

  for (const feed of config.newsFeeds) {
    try {
      const list = feed.type === 'sina' ? await fetchSina(feed.url) : await fetchRss(feed.url);
      for (const it of list.slice(0, perSource)) {
        const key = it.title;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push({
          title: it.title,
          summary: it.summary,
          source: feed.name,
          category: feed.category,
          url: it.url,
          image: it.image,
          news_date: today,
        });
      }
    } catch (err) {
      console.warn(`[news] 抓取 ${feed.name} 失败：${err.message}`);
    }
  }

  const items = collected.slice(0, config.newsMaxItems);

  // 图片兜底：无图新闻从同批「有图新闻」中借用图片（同分类优先，其次全局），保证卡片尽量有图展示
  const poolByCat = {};
  const poolAll = [];
  items.forEach((it) => {
    if (it.image) {
      poolAll.push(it.image);
      (poolByCat[it.category] = poolByCat[it.category] || []).push(it.image);
    }
  });
  if (poolAll.length) {
    items.forEach((it, idx) => {
      if (it.image) return;
      const pool = poolByCat[it.category]?.length ? poolByCat[it.category] : poolAll;
      it.image = pool[idx % pool.length];
    });
  }

  if (items.length) {
    await run(from('news').insert(items).select('id'), '缓存新闻失败');
    return items;
  }
  return [];
}
