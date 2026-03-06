"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted
    ? (resolvedTheme ?? (document.documentElement.classList.contains("dark") ? "dark" : "light")) === "dark"
    : false

  const toggleTheme = () => {
    if (!mounted) return
    const next = isDark ? "light" : "dark"

    // 1) 正常走 next-themes（负责持久化、跟随系统等）
    setTheme(next)

    // 2) 兜底：确保 html 上的 class 立即更新
    const root = document.documentElement
    root.classList.remove("light", "dark")
    if (next === "dark") root.classList.add("dark")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      type="button"
      aria-label="切换主题"
      onClick={toggleTheme}
    >
      {/* Sun：浅色时显示，深色时缩放隐藏 */}
      <Sun
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      {/* Moon：浅色时隐藏，深色时缩放显示 */}
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">切换主题</span>
    </Button>
  )
}