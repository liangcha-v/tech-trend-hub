import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SyncButton } from "@/components/SyncButton" // 引入新按钮

// 接收 searchParams 参数
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>
}) {
  const { source } = await searchParams

  
  // 基础查询
  let query = supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false })

  // 如果不是 "all"，则添加筛选条件
  if (source && source !== "all") {
    query = query.eq("source", source)
  }

  const { data: trends } = await query.limit(12)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="font-semibold text-lg tracking-tight">
            {source && source !== 'all' ? `${source.toUpperCase()} 热门` : '今日热门趋势'}
          </div>
          {/* 💡 这里放置我们的同步按钮，并传入当前的 source */}
          <SyncButton source={source} />
          <ThemeToggle />
        </header>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trends && trends.length > 0 ? (
            trends.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-all border-muted-foreground/10 flex flex-col">
                {/* ... Card 内部代码保持不变 ... */}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none capitalize cursor-default">
                      {item.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors cursor-pointer line-clamp-1">
                    <a href={item.link} target="_blank" className="cursor-pointer">{item.title}</a>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs min-h-[32px]">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                {/* ... 其他部分 ... */}
                <CardContent className="flex-1">
                  {item.ai_summary && (
                    <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1.5 text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="font-bold text-[10px] uppercase tracking-widest">AI 摘要</span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed italic">
                        {item.ai_summary}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end text-[11px] text-muted-foreground pt-0">
                  <a href={item.link} target="_blank" className="cursor-pointer p-1 hover:text-primary transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              该分类下暂无内容，请运行 API 同步数据。
            </div>
          )}
        </div>
      </main>
    </div>
  )
}