import RSSParser from 'rss-parser';
import { supabase } from './supabase';
import {generateAISummary} from './ai'

const parser = new RSSParser();

/**
 * 1. 严格的基础接口定义
 */
/**
 * 1. 修正后的掘金接口定义
 */
interface JuejinRawItem {
  content: {
    content_id: string; // 对应实际返回的 content_id
    title: string;
    brief: string;
  };
  // 如果需要阅读量或点赞，可以加在这里
  content_counter?: {
    view: number;
    like: number;
  };
}
interface RSSItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

interface V2EXItem {
  title: string;
  url: string;
  content?: string;
  node?: { title: string };
  replies?: number;
}

// Hacker News 官方 API 返回的是 ID 数组，这里定义单项结构
interface HNItem {
  title: string;
  url?: string;
  score: number;
  id: number;
}

interface TransformedTrend {
  title: string;
  description: string;
  link: string;
  metadata: Record<string, unknown>;
}

/**
 * 2. 判别式联合类型配置
 */
interface BaseConfig<T> {
  name: string;
  url: string;
  sourceTag: string;
  transform?: (raw: T) => TransformedTrend;
}
interface JuejinConfig extends BaseConfig<JuejinRawItem[]> {
  type: 'juejin';
}
interface JSONConfig extends BaseConfig<V2EXItem[]> { type: 'json'; }
interface RSSConfig extends BaseConfig<RSSItem> { type: 'rss';transform: (raw: RSSItem) => TransformedTrend; }
interface HNConfig extends BaseConfig<number[]> { type: 'hn'; } // 特殊处理 HN

export type ScraperConfig = JuejinConfig | JSONConfig | RSSConfig | HNConfig;

/**
 * 3. 稳定技术源配置列表
 */
export const SCRAPER_CONFIGS: ScraperConfig[] = [
  {
    name: "掘金热榜",
    url: "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot",
    type: 'juejin',
    sourceTag: 'juejin',
  },
  {
    name: "V2EX",
    url: "https://www.v2ex.com/api/topics/hot.json",
    type: 'json',
    sourceTag: 'v2ex',
    transform: (rawList) => {
      const first = rawList[0];
      return { title: first.title, description: "", link: first.url, metadata: {} };
    }
  },
  {
    name: "阮一峰的网络日志",
    url: "https://feeds.feedburner.com/ruanyifeng", 
    type: 'rss',
    sourceTag: 'ruanyifeng',
    transform: (raw) => ({
      title: raw.title || "技术周报",
      description: (raw.contentSnippet || raw.description || "").slice(0, 150),
      link: raw.link || "",
      metadata: { date: raw.pubDate }
    })
  },
  // {
  //   name: "Hacker News",
  //   url: "https://hacker-news.firebaseio.com/v0/topstories.json",
  //   type: 'hn',
  //   sourceTag: 'hackernews',
  //   transform: (rawList) => {
  //     return { title: "HN Top", description: "", link: "", metadata: {} };
  //   }
  // },
  // {
  //   name: "掘金热榜",
  //   url: "https://rss.injahow.cn/juejin/trending/all/hot", // 掘金全站热榜
  //   type: 'rss',
  //   sourceTag: 'juejin',
  //   transform: (raw) => ({
  //     title: raw.title || "掘金热帖",
  //     description: (raw.contentSnippet || raw.description || "").replace(/<[^>]*>?/gm, '').slice(0, 150),
  //     link: raw.link || "",
  //     metadata: { date: raw.pubDate }
  //   })
  // },

  {
    name: "开源中国",
    url: "https://rss.injahow.cn/oschina/news", // 开源中国最新资讯
    type: 'rss',
    sourceTag: 'oschina',
    transform: (raw) => ({
      title: raw.title || "开源资讯",
      description: (raw.contentSnippet || raw.description || "").replace(/<[^>]*>?/gm, '').slice(0, 150),
      link: raw.link || "",
      metadata: { date: raw.pubDate }
    })
  }
];

/**
 * 4. 核心执行逻辑
 */
export async function executeScrape(config: ScraperConfig): Promise<boolean> {
  try {
    let finalData: (TransformedTrend & { source: string })[] = [];

    // 分流处理不同类型
    // 分流处理不同类型
    if (config.type === 'juejin') {
      const res = await fetch(config.url, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
        // 这里的 Payload 也要根据实际 API 微调
        // body: JSON.stringify({ 
        //   item_type: 2, 
        //   cursor: "0", 
        //   limit: 20,
        //   category_id: "1", // 明确分类
        //   type: "hot" 
        // }), 
        cache: 'no-store'
      });
      
      const json = await res.json() as { data: JuejinRawItem[] };
      // 🕵️ 排查点 1: 看看接口到底返回了什么，是不是 err_no 不为 0
      console.log("掘金原始返回:", JSON.stringify(json).slice(0, 200));
      const rawItems = json.data as JuejinRawItem[];
      
      // 🕵️ 排查点 2: 看看解析后的数组长度
      console.log("掘金解析后的数组长度:", rawItems?.length);
      // 核心修正：访问 .content 路径
      finalData = json.data
      .map((item): (TransformedTrend & { source: string }) | null => {
        // 🕵️ 排查 2: 路径防御
        if (!item.content?.content_id) return null;
        
        return {
          title: item.content.title,
          description: item.content.brief?.trim() || `${item.content.title} - 掘金热榜`,
          link: `https://juejin.cn/post/${item.content.content_id}`,
          metadata: {
            views: item.content_counter?.view,
            likes: item.content_counter?.like
          },
          source: config.sourceTag
        };
      })
      // 🕵️ 类型安全过滤：使用 is 关键字排除 null
      .filter((item): item is (TransformedTrend & { source: string }) => item !== null);

    console.log(`[掘金] 最终准备写入的数据量: ${finalData.length}`);

    } else if (config.type === 'json') {
      const res = await fetch(config.url, { cache: 'no-store' });
      const rawItems = (await res.json()) as V2EXItem[];
      finalData = rawItems.slice(0, 15).map(item => ({
        title: item.title,
        description: item.content?.slice(0, 200) || "V2EX 热议话题",
        link: item.url,
        metadata: { node: item.node?.title, replies: item.replies },
        source: config.sourceTag
      }));

    } else if (config.type === 'rss') {
      const res = await fetch(config.url, { cache: 'no-store' });
      const xml = await res.text();
      const feed = await parser.parseString(xml);
      const rawItems = feed.items as unknown as RSSItem[];
      finalData = rawItems.slice(0, 10).map(item => ({
        ...config.transform(item),
        source: config.sourceTag
      }));

    } else if (config.type === 'hn') {
      // Hacker News 特殊逻辑：先拿 ID 列表，再拿前 10 个详情
      const idRes = await fetch(config.url, { cache: 'no-store' });
      const ids = (await idRes.json()) as number[];
      const topIds = ids.slice(0, 10);
      
      const detailPromises = topIds.map(async (id) => {
        const detailRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return (await detailRes.json()) as HNItem;
      });
      
      const details = await Promise.all(detailPromises);
      finalData = details.map(item => ({
        title: item.title,
        description: `Score: ${item.score} points on Hacker News`,
        link: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        metadata: { score: item.score },
        source: config.sourceTag
      }));
    }

    if (finalData.length === 0) return false;

    if (finalData.length === 0) return false;

// 🚀 新增：为前 5 条数据补充 AI 总结
console.log(`[${config.name}] 正在生成 AI 摘要...`);
const dataWithAI = await Promise.all(
  finalData.map(async (item, index) => {
    // 仅对前 5 条生成摘要，且如果已有摘要则跳过（如果是更新操作）
    if (index < 10) {
      const summary = await generateAISummary(item.title, item.description);
      return { ...item, ai_summary: summary };
    }
    return item;
  })
);

// 使用处理后的 dataWithAI 进行 upsert
const { error } = await supabase.from("trends").upsert(dataWithAI, { onConflict: 'link' });
if (error) throw error;

    console.log(`[${config.name}] 同步成功`);
    return true;

  } catch (err) {
    console.error(`[${config.name}] 错误:`, err instanceof Error ? err.message : String(err));
    return false;
  }
}

export async function syncAllSources() {
  const tasks = SCRAPER_CONFIGS.map(config => executeScrape(config));
  return await Promise.allSettled(tasks);
}