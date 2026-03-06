import { supabase } from "./supabase";
import Parser from "rss-parser";
// 1. 记得在文件顶部引入 ai 工具
import { generateAISummary } from "./ai";

const parser = new Parser();

// 1. 定义数据库标准结构
interface BaseItem {
  title: string;
  description: string;
  link: string;
  source: string;
  metadata: Record<string, string | number | boolean | undefined>;
}

// 2. 定义各平台原始数据类型
interface V2EXRaw {
  title: string;
  content: string;
  url: string;
  replies: number;
  node?: { title: string };
}

interface GitHubRSSRaw {
  title?: string;
  contentSnippet?: string;
  link?: string;
  author?: string;
}

// 3. 定义通用的配置映射器
interface ScraperConfig<T> {
  name: string;
  url: string;
  type: 'json' | 'rss';
  sourceTag: string;
  transform: (raw: T) => Omit<BaseItem, 'source'>;
}

// 4. 网站配置表
const SCRAPER_CONFIGS: [ScraperConfig<V2EXRaw>, ScraperConfig<GitHubRSSRaw>] = [
  {
    name: "V2EX",
    url: "https://www.v2ex.com/api/topics/hot.json",
    type: 'json',
    sourceTag: 'v2ex',
    transform: (raw) => ({
      title: raw.title,
      description: raw.content?.slice(0, 300) || "无描述",
      link: raw.url,
      metadata: { node: raw.node?.title, replies: raw.replies }
    })
  },
  {
    name: "GitHub",
    url: "https://rss.feed43.com/9363065842817282.xml",
    type: 'rss',
    sourceTag: 'github',
    transform: (raw) => ({
      title: raw.title || "未知项目",
      description: raw.contentSnippet || "No description",
      link: raw.link || "",
      metadata: { author: raw.author }
    })
  }
];

// 5. 核心执行逻辑
async function executeScrape<T>(config: ScraperConfig<T>): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      let rawItems: T[] = []; // 1. 在 if/else 外部声明，确保后面能访问到
  
      if (config.type === 'json') {
        const res = await fetch(config.url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rawItems = await res.json() as T[];
      } else {
        const feed = await parser.parseURL(config.url);
        // 这里的类型转换确保兼容 RSS Parser 的固有属性
        rawItems = (feed.items as unknown) as T[];
      }
  
      if (!rawItems || rawItems.length === 0) {
        return { success: false, count: 0, error: "未获取到原始数据" };
      }
  
      // 2. 取前 5 条进行处理（节省 AI 额度并防止超时）
      const baseData = rawItems.slice(0, 5).map(item => ({
        ...config.transform(item),
        source: config.sourceTag
      }));
  
      console.log(`>>> 正在为 ${config.name} 生成 AI 摘要...`);
  
      // 3. 并行调用 AI 接口
      const finalData = await Promise.all(
        baseData.map(async (item) => {
          // 调用我们之前在 lib/ai.ts 定义的函数
          const ai_summary = await generateAISummary(item.title, item.description);
          return {
            ...item,
            ai_summary: ai_summary || "暂无 AI 总结"
          };
        })
      );
  
      // 4. 写入 Supabase
      const { error } = await supabase.from("trends").upsert(finalData, { onConflict: 'link' });
      if (error) throw error;
  
      return { success: true, count: finalData.length };
    } catch (err) {
      console.error(`>>> ${config.name} 任务失败:`, err);
      return { 
        success: false, 
        count: 0, 
        error: err instanceof Error ? err.message : String(err) 
      };
    }
  }
export async function syncAllSources() {
  const v2exResult = await executeScrape(SCRAPER_CONFIGS[0]);
//   const githubResult = await executeScrape(SCRAPER_CONFIGS[1]);
  return { v2ex: v2exResult};
//   return { v2ex: v2exResult, github: githubResult };
}