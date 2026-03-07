import { NextResponse } from "next/server";
import { syncAllSources, executeScrape, SCRAPER_CONFIGS, type ScraperConfig } from "@/lib/scrapers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');

  let results;

  if (source && source !== 'all') {
    // 💡 给 c 加上类型标注 : ScraperConfig
    const config = SCRAPER_CONFIGS.find((c: ScraperConfig) => c.sourceTag === source);
    
    if (config) {
      const success = await executeScrape(config);
      results = [{ status: 'fulfilled', value: success }];
    } else {
      // 如果没找到对应的配置，返回一个提示
      return NextResponse.json({ message: `未找到源: ${source}` }, { status: 404 });
    }
  } else {
    results = await syncAllSources();
  }

  return NextResponse.json({
    message: source ? `${source} 同步完成` : "全量同步完成",
    results
  });
}