interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

const API_KEY = process.env.SILICONFLOW_API_KEY;

export async function generateAISummary(title: string, content: string): Promise<string | null> {
  if (!API_KEY) {
    console.warn(">>> 警告: 未配置 SILICONFLOW_API_KEY，跳过 AI 总结");
    return null;
  }

  try {
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: [
          {
            role: "system",
            content:
              "你是一个资深技术博主。请将提供的技术帖子标题和内容，总结成一句极其精炼的中文摘要（60字以内）。如果是英文请翻译。直接输出摘要，不要带有'摘要：'等前缀。",
          },
          {
            role: "user",
            content: `标题: ${title}\n内容: ${content.slice(0, 800)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) throw new Error(`AI 接口返回错误: ${response.status}`);

    const data = (await response.json()) as AIResponse;
    return data.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error(">>> AI 总结生成失败:", error);
    return null;
  }
}

export async function generateAISummaryStrict(title: string, content: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("未配置 SILICONFLOW_API_KEY，无法保证每条数据都生成 AI 总结");
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const summary = await generateAISummary(title, content);
    if (summary) {
      return summary;
    }
  }

  throw new Error(`AI 总结生成失败: ${title}`);
}
