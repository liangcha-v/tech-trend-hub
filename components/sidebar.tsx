"use client"

import * as React from "react"
// 引入 RefreshCw 图标用于显示同步状态
import { 
  Coffee, 
  Bookmark, 
  Zap, 
  BookOpen, 
  LayoutGrid,
  RefreshCw 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useRouter, useSearchParams } from "next/navigation"

const menuItems = [
  { name: "全部聚合", icon: LayoutGrid, id: "all" },
  { name: "V2EX 技术", icon: Coffee, id: "v2ex" },
  { name: "阮一峰周刊", icon: BookOpen, id: "ruanyifeng" },
  { name: "掘金热榜", icon: Zap, id: "juejin" },
  { name: "开源中国", icon: BookOpen, id: "oschina" },
]

export function Sidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSource = searchParams.get("source") || "all"
  const currentView = searchParams.get("view")

  // --- 新增：记录哪个源正在同步的状态 ---
  const [syncingId, setSyncingId] = React.useState<string | null>(null)

  // --- 修改后的点击处理函数 ---
  const handleItemClick = async (id: string) => {
    // 1. 立即跳转页面 (让 Server Component 先从数据库读旧数据)
    const path = id === "all" ? "/" : `/?source=${id}`
    router.push(path)

    // 2. 触发后台同步
    setSyncingId(id)
    try {
      // 调用你支持 source 参数的 API
      await fetch(`/api/fetch/all?source=${id}`)
      
      // 3. 同步成功后，刷新页面数据 (Server Component 会重新查询数据库)
      router.refresh()
    } catch (error) {
      console.error("同步失败:", error)
    } finally {
      setSyncingId(null)
    }
  }

  const handleFavoritesClick = () => {
    router.push("/?view=favorites")
  }

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">TechTrend</h1>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4">
          <div className="py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              内容聚合
            </h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView !== "favorites" && currentSource === item.id ? "secondary" : "ghost"}
                  // --- 修改此处 onClick ---
                  onClick={() => handleItemClick(item.id)}
                  disabled={syncingId === item.id}
                  className={cn(
                    "w-full justify-start gap-3 text-sm font-medium transition-all",
                    currentView !== "favorites" && currentSource === item.id ? "bg-secondary shadow-sm" : "hover:bg-ghost"
                  )}
                >
                  {/* --- 动态图标：同步时转圈，平时显示原图标 --- */}
                  {syncingId === item.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <item.icon className={cn(
                      "h-4 w-4",
                      currentView !== "favorites" && currentSource === item.id ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator className="mx-2" />
          
          <div className="py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              个人空间
            </h2>
            <div className="space-y-1">
              <Button
                variant={currentView === "favorites" ? "secondary" : "ghost"}
                onClick={handleFavoritesClick}
                className={cn(
                  "w-full justify-start gap-3 text-sm font-medium",
                  currentView === "favorites" ? "bg-secondary shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Bookmark className="h-4 w-4" />
                我的收藏
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 mt-auto border-t bg-muted/20">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-medium text-muted-foreground/60 tracking-wider">
            TECHTREND HUB
          </p>
          <p className="text-[9px] text-muted-foreground/40">
            v1.1.0 • Stable Build
          </p>
        </div>
      </div>
    </div>
  )
}
