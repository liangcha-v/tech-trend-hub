// 定义接口以确保类型安全
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
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V3",
          messages: [
            {
              role: "system",
              content: "你是一个资深技术博主。请将提供的技术帖子标题和内容，总结成一句极其精炼的中文摘要（60字以内）。如果是英文请翻译。直接输出摘要，不要带有'摘要：'等前缀。"
            },
            {
              role: "user",
              content: `标题: ${title}\n内容: ${content.slice(0, 800)}` // 限制长度节省 Token
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });
  
      if (!response.ok) throw new Error(`AI 接口返回错误: ${response.status}`);
  
      const data = (await response.json()) as AIResponse;
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error(">>> AI 总结生成失败:", error);
      return null;
    }
  }