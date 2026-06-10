import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

interface RawNote {
  time: string;
  text: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const systemPrompt = `你是一个私人日记助手。用户会提供一天中多个时间点记录的口述片段，请将其整理成一篇简洁、通顺的日记。要求：
- 以第一人称书写，语气自然、口语化、不文学化
- 去除明显的语气词和重复
- 按主题而非时间组织内容。把相关内容归到一起，自然地分段落。每个段落开头可以有一个简短的小标题（如「上午开会」「学到的」「想法」），但不要勉强，没主题就不加
- 对于本身有结构的内容（步骤、清单、知识点），保留或补全其结构，用 1. 2. 3. 或分点呈现，不要"翻译"成一大段文字
- 一句话摘要：不是概括所有事，而是抓住今天最特别、印象最深的那一个点。如果今天没什么特别的，诚实地说"平常的一天"

请以 JSON 格式返回，格式为：{"content": "日记正文", "summary": "一句话摘要"}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { rawNotes } = (await req.json()) as { rawNotes: RawNote[] };

    if (!rawNotes?.length) {
      return new Response(JSON.stringify({ error: "没有提供日记内容", code: "EMPTY_INPUT" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const notesText = rawNotes.map((n) => `[${n.time}] ${n.text}`).join("\n");

    // Step 1: Call DeepSeek with streaming, accumulate full response
    const dsResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
        stream: true,
      }),
    });

    if (!dsResponse.ok) {
      return new Response(JSON.stringify({
        error: "AI 服务暂时不可用，请稍后重试",
        code: "API_ERROR",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Step 2: Read entire DeepSeek stream and accumulate
    const reader = dsResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content;
          if (token) fullText += token;
        } catch { /* skip */ }
      }
    }

    // Step 3: Parse JSON from accumulated text
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({
        error: "AI 返回格式异常，请重试",
        code: "PARSE_ERROR",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let content: string;
    let summary: string;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      content = parsed.content || fullText;
      summary = parsed.summary || "";
    } catch {
      return new Response(JSON.stringify({
        error: "AI 返回格式异常，请重试",
        code: "PARSE_ERROR",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Step 4: Stream clean content + summary to client
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        // Split content into small chunks for client-side animation
        const chunkSize = 3;
        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`)
          );
        }
        // Send summary as final event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "summary", text: summary })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "处理请求时出错，请重试",
      code: "INTERNAL_ERROR",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
