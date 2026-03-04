export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { data } = req.body;

  const prompt = `You are a visionary business coach writing a short, emotionally compelling story for a coach who just mapped out their Skool community.

Using their specific information below, write a 3-paragraph aspirational vision of what their coaching business looks like 90 days after building this community. Make it vivid and specific — use their niche, their positioning, their phase names. Write in second person ("you").

PARAGRAPH 1 — THE MORNING:
What does a Tuesday morning look like? They wake up to MRR notifications, new community members who joined overnight, activity already happening in their Skool without them. Their phone shows recurring revenue that didn't require a single sales call. Make it specific to their niche and transformation category.

PARAGRAPH 2 — THE WORK:
They're running a group coaching call — not spending an hour delivering the same insight they've delivered a hundred times in 1-on-1s. One hotseat. One breakthrough. And 30, maybe 50 people in the room all learning from it simultaneously. Between calls, the community is coaching itself — members sharing wins, answering each other's questions using the language and frameworks from the phases they built. The culture flywheel is spinning: the more people join, the more valuable it becomes. Their methodology isn't just delivered — it's alive in the room. Reference their specific phases by name.

PARAGRAPH 3 — THE FEELING + THE PITCH:
The contrast with before — no more chasing clients, no more income ceiling, no more trading hours for dollars. But the real shift is structural: their lead generation is automated and aligned. A small daily ad spend brings in the right people consistently. A lead magnet filters for serious buyers. A nurture sequence does the educating and the selling. By the time someone books a call, they already believe. The only question left is whether they're ready to build it — and a single strategy session is where that answer gets made.

End with one sentence that makes booking the call feel like the obvious, inevitable next move.

Tone: Warm but direct. Aspirational but grounded. Not hype — earned optimism. Specific, not generic.

Coach's information:
- Positioning statement: ${data.statement}
- Niche / person they help: ${data.person}
- Transformation category: ${data.category}
- Client's starting point (Point A): ${data.clientPain}
- What client wants most: ${data.clientWants}
- The result delivered (Point B): ${data.result} in ${data.timeframe}
- Their system phases: ${data.phases.join(", ")}

Write exactly 3 paragraphs separated by a blank line. No headers. No labels. Just the story.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.trim());
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
            }
          } catch {}
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.status(500).json({ error: "Generation failed" });
  }
}
