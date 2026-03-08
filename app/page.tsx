import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase"
import { SyncButton } from "@/components/SyncButton"
import { TrendList } from "@/components/trend-list"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; view?: string }>
}) {
  const { source, view } = await searchParams
  const showFavoritesOnly = view === "favorites"

  let query = supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false })

  if (!showFavoritesOnly && source && source !== "all") {
    query = query.eq("source", source)
  }

  const { data: trends } = await query.limit(showFavoritesOnly ? 200 : 12)

  const title = showFavoritesOnly
    ? "我的收藏"
    : source && source !== "all"
      ? `${source.toUpperCase()} 热门`
      : "今日热门趋势"

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="font-semibold text-lg tracking-tight">{title}</div>
          <SyncButton source={source} />
          <ThemeToggle />
        </header>

        <TrendList trends={trends ?? []} showFavoritesOnly={showFavoritesOnly} />
      </main>
    </div>
  )
}
