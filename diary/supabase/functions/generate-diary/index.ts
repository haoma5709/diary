import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

interface RawNote {
  time: string;
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { rawNotes } = (await req.json()) as { rawNotes: RawNote[] };

    if (!rawNotes?.length) {
      return new Response(JSON.stringify({ error: "没有提供日记内容", code: "EMPTY_INPUT" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const notesText = rawNotes
      .map((n) => `[${n.time}] ${n.text}`)
      .join("\n");

    const systemPrompt = `你是一个私人日记助手。用户会提供一天中多个时间点记录的口述片段，请将其整理成一篇简洁、通顺的日记。要求：
- 以第一人称书写
- 保持口语化、自然，不要过于文学化
- 按时间顺序组织内容
- 去除明显的语气词和重复
- 同时生成一个8字以内的一句话摘要

请以 JSON 格式返回，格式为：{"content": "日记正文", "summary": "一句话摘要"}`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: notesText },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: "AI 服务暂时不可用，请稍后重试",
        code: "API_ERROR",
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({
        error: "AI 返回格式异常，请重试",
        code: "PARSE_ERROR",
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      content: result.content ?? aiMessage,
      summary: result.summary ?? "",
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "处理请求时出错，请重试",
      code: "INTERNAL_ERROR",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
