"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bookmark, ExternalLink, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type TrendItem = {
  id: number
  source: string
  created_at: string
  title: string
  link: string
  description: string | null
  ai_summary: string | null
  is_favorite: boolean | null
}

export function TrendList({
  trends,
  showFavoritesOnly,
}: {
  trends: TrendItem[]
  showFavoritesOnly: boolean
}) {
  const [favoriteIds, setFavoriteIds] = React.useState<Set<number>>(
    new Set(trends.filter((item) => item.is_favorite).map((item) => item.id))
  )
  const [pendingIds, setPendingIds] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    setFavoriteIds(new Set(trends.filter((item) => item.is_favorite).map((item) => item.id)))
  }, [trends])

  const toggleFavorite = async (id: number) => {
    if (pendingIds.has(id)) return

    const nextValue = !favoriteIds.has(id)
    setPendingIds((prev) => new Set(prev).add(id))

    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (nextValue) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })

    const { error } = await supabase
      .from("trends")
      .update({ is_favorite: nextValue })
      .eq("id", id)

    if (error) {
      setFavoriteIds((prev) => {
        const rollback = new Set(prev)
        if (nextValue) {
          rollback.delete(id)
        } else {
          rollback.add(id)
        }
        return rollback
      })
      console.error("收藏状态更新失败:", error.message)
    }

    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const displayTrends = showFavoritesOnly
    ? trends.filter((item) => favoriteIds.has(item.id))
    : trends

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayTrends.length > 0 ? (
        displayTrends.map((item) => {
          const isFavorite = favoriteIds.has(item.id)

          return (
            <Card key={item.id} className="group hover:shadow-lg transition-all border-muted-foreground/10 flex flex-col">
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
              <CardFooter className="flex justify-between text-[11px] text-muted-foreground pt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleFavorite(item.id)}
                  aria-label={isFavorite ? "取消收藏" : "收藏"}
                  disabled={pendingIds.has(item.id)}
                >
                  <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-current text-primary" : ""}`} />
                </Button>
                <a href={item.link} target="_blank" className="cursor-pointer p-1 hover:text-primary transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardFooter>
            </Card>
          )
        })
      ) : (
        <div className="col-span-full text-center py-20 text-muted-foreground">
          {showFavoritesOnly ? "你还没有收藏内容，先去主页收藏一些卡片吧。" : "该分类下暂无内容，请运行 API 同步数据。"}
        </div>
      )}
    </div>
  )
}
