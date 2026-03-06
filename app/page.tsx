import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Sparkles, Star } from "lucide-react"
// 1. 在文件顶部引入 supabase 客户端
import { supabase } from "@/lib/supabase"

// 2. 将 Home 函数改为 async
export default async function Home() {
  // 从 Supabase 获取最新的 10 条数据
  const { data: trends } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="font-semibold text-lg tracking-tight">今日热门趋势</div>
          <ThemeToggle />
        </header>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 3. 循环渲染从数据库读到的数据 */}
          {trends?.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all border-muted-foreground/10 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none capitalize">
                    {item.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-base font-bold group-hover:text-primary transition-colors cursor-pointer line-clamp-1">
                  <a href={item.link} target="_blank">{item.title}</a>
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs min-h-[32px]">
                  {item.description}
                </CardDescription>
              </CardHeader>

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
                <a href={item.link} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5 cursor-pointer hover:text-primary transition-colors" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}