#!/usr/bin/env node
// 用法：node build.js 需要 Node 18+（自带 fetch）

const fs = require('node:fs');
const path = require('node:path');

const SOURCES = [
  { name: 'BBC 中文', cat: '国际', url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml' },
  { name: '联合早报', cat: '国内', url: 'https://www.zaobao.com.sg/rss/realtime/china' },
  { name: '36氪', cat: '科技', url: 'https://36kr.com/feed' },
  { name: '少数派', cat: '科技', url: 'https://sspai.com/feed' },
  { name: 'Hacker News', cat: '科技', url: 'https://hnrss.org/frontpage' },
  { name: 'The Verge', cat: '科技', url: 'https://www.theverge.com/rss/index.xml' },
];

const stripTags = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const unCdata = s => String(s || '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');

function firstTag(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, 'i'));
    if (m) return m[1];
  }
  return '';
}

function linkOf(block) {
  const a = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    || block.match(/<link[^>]*href=["']([^"']+)["']/i);

  if (a) return a[1].trim();
  return stripTags(firstTag(block, ['link']));
}

function parseFeed(xml) {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) || [];
  return blocks.map(b => {
    const raw = stripTags(firstTag(b, ['pubDate', 'published', 'updated', 'dc:date']));
    const d = raw ? new Date(raw) : null;

    return {
      title: stripTags(unCdata(firstTag(b, ['title']))),
      link: linkOf(b),
      summary: stripTags(unCdata(firstTag(b, ['description', 'summary', 'content']))).slice(0, 180),
      publishedAt: d && !isNaN(d) ? d.toISOString() : null,
    };
  }).filter(x => x.title && x.link);
}

async function main() {
  const all = [];

  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; NewsBuilder/1.0)' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const items = parseFeed(await res.text())
        .map(it => ({ ...it, source: src.name, cat: src.cat }));

      console.log(`${src.name}: ${items.length} 条`);
      all.push(...items);
    } catch (e) {
      console.warn(`${src.name}: 跳过 —— ${e.message}`);
    }
  }

  const seen = new Set();
  const items = all
    .filter(it => {
      const k = it.link.split('?')[0];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map(it => ({ ...it, id: it.link.split('?')[0] }))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    .slice(0, 200);

  if (!items.length) {
    console.error('没有抓到任何条目，保留原 news.json');
    process.exit(1);
  }

  const generatedAt = new Date().toISOString();
  const dir = path.join(__dirname, 'data');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'news.json'),
    JSON.stringify({ generatedAt, items })
  );
  fs.writeFileSync(
    path.join(dir, 'version.json'),
    JSON.stringify({ generatedAt, count: items.length })
  );

  console.log(`写出 ${items.length} 条，generatedAt = ${generatedAt}`);
}

main();
