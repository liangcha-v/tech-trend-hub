"use client"

import * as React from "react"
import { Home, TrendingUp, Github, Coffee, Bookmark, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const menuItems = [
  { name: "全部热点", icon: Home, active: true },
  { name: "GitHub Trending", icon: Github },
  { name: "Hacker News", icon: TrendingUp },
  { name: "V2EX 技术", icon: Coffee },
]

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Logo 区域 */}
      <div className="p-6 flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">TechTrend</h1>
      </div>
      
      {/* 滚动菜单区域 */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4">
          <div className="py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              内容聚合
            </h2>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.name}
                  variant={item.active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 text-sm font-medium",
                    item.active && "bg-secondary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              个人空间
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 text-sm font-medium">
                <Bookmark className="h-4 w-4" />
                我的收藏
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* 底部信息 */}
      <div className="p-4 mt-auto border-t">
        <p className="text-[10px] text-center text-muted-foreground">
          TechTrend Hub v1.0.0
        </p>
      </div>
    </div>
  )
}