import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const mockData = {
    title: "DeepSeek-V3 开源项目",
    description: "一个强大的开源模型，具有极高的推理性能。",
    link: "https://github.com/deepseek-ai/DeepSeek-V3",
    source: "github",
    metadata: { stars: 5000 },
    ai_summary: "这是通过 API 插入的测试数据，证明数据库连接成功。"
  };

  // 插入数据到 trends 表
  const { data, error } = await supabase
    .from("trends")
    .upsert(mockData, { onConflict: 'link' }) // 如果链接已存在则更新，不存在则插入
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}