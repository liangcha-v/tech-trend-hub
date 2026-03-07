"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function SyncButton({ source = "all" }: { source?: string }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // 1. 调用你写好的同步接口，传入当前源
      await fetch(`/api/fetch/all?source=${source}`)
      
      // 2. 关键：刷新当前页面的服务端数据
      // 这会让 Home 重新在服务器运行一次查询
      router.refresh() 
    } catch (error) {
      console.error("同步失败:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing}
      className={`p-2 hover:bg-accent rounded-full transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={`同步 ${source} 数据`}
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
    </button>
  )
}