export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const { data } = req.body;

  const prompt = `You are a world-class positioning strategist for coaches and online educators.

Based on the following information about a coach, write ONE razor-sharp positioning statement in this format:

"I help [specific person] who [specific visceral problem] achieve [specific measurable result] — without [their biggest fear or sacrifice]."

The statement must be:
- Specific enough that the right person immediately recognizes themselves
- Emotionally resonant — speak to the desperation or aspiration, not just the logic
- Credible and concrete — include a result that feels real and achievable
- Punchy — one sentence, no fluff

Coach's information:
- Transformation category: ${data.category}
- Their specific person: ${data.person}
- Best results with: ${data.bestResults}
- What their clients have already tried: ${data.alreadyTried}
- The visceral pain they're escaping: ${data.pain}
- The belief keeping them stuck: ${data.belief}
- The specific result delivered: ${data.result}
- Timeframe: ${data.timeframe}

Return ONLY the positioning statement. No preamble, no explanation, no quotation marks. Just the statement itself.`;

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
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const result = await response.json();
    const text = result.content?.[0]?.text || "";
    return res.status(200).json({ statement: text });
  } catch (err) {
    return res.status(500).json({ error: "Generation failed" });
  }
}
