import { useState } from "react";

const ORANGE = "#e8562a";
const OB = "rgba(232,86,42,0.2)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .fu { animation: fadeUp 0.4s ease forwards; }
  .pulse { animation: pulse 1.5s infinite; }
  textarea, input { font-family: 'DM Sans', sans-serif; }
  textarea:focus, input:focus { outline: none; border-color: ${ORANGE} !important; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
  .cat-tile:hover { border-color: ${ORANGE} !important; background: rgba(232,86,42,0.06) !important; }
  .phase-card { transition: border-color 0.2s; }
`;

const Label = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: sub ? 8 : 0 }}>{children}</div>
    {sub && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>{sub}</div>}
  </div>
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{
      width: "100%", background: "#111", border: "1px solid #222",
      borderRadius: 8, color: "#e8e4dc", fontSize: 13, lineHeight: 1.7,
      padding: "12px 14px", resize: "none", transition: "border-color 0.2s",
    }}
  />
);

const TextInput = ({ value, onChange, placeholder }) => (
  <input
    type="text" value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: "100%", background: "#111", border: "1px solid #222",
      borderRadius: 8, color: "#e8e4dc", fontSize: 13,
      padding: "12px 14px", transition: "border-color 0.2s",
    }}
  />
);

const NextBtn = ({ label, onClick, disabled, loading }) => (
  <button onClick={onClick} disabled={disabled || loading} style={{
    width: "100%", background: disabled || loading ? "#1a1a1a" : ORANGE,
    color: disabled || loading ? "#444" : "#fff", border: "none",
    borderRadius: 8, padding: "14px", fontFamily: "'DM Sans',sans-serif",
    fontWeight: 500, fontSize: 13, letterSpacing: "0.06em",
    cursor: disabled || loading ? "not-allowed" : "pointer", transition: "all 0.2s",
    marginTop: 20,
  }}>
    {loading ? "Generating..." : label}
  </button>
);

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: "transparent", color: "#444", border: "none",
    padding: "10px 0", fontSize: 12, cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.06em",
  }}>← Back</button>
);

function ProgressBar({ current, total }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ height: 2, background: "#1a1a1a", borderRadius: 2 }}>
        <div style={{
          width: `${(current / total) * 100}%`, height: "100%",
          background: ORANGE, borderRadius: 2, transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ fontSize: 10, color: "#444", marginTop: 5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {current} of {total}
      </div>
    </div>
  );
}

// ── CLAUDE API ────────────────────────────────────────────────────────────────

async function generatePositioningStatement(data) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.statement || "";
}

async function generateVision(data) {
  const response = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.vision || "";
}

// ── TRANSFORMATION CATEGORIES ─────────────────────────────────────────────────

const CATEGORIES = [
  { id: "money",  emoji: "💰", label: "Make More Money",          sub: "Business, sales, career, income, freelancing" },
  { id: "love",   emoji: "❤️", label: "Increase Love",            sub: "Dating, relationships, emotional security, intimacy" },
  { id: "beauty", emoji: "💪", label: "Increase Beauty & Health", sub: "Fitness, hormones, skin, vitality, aesthetics" },
  { id: "pain",   emoji: "😣", label: "Decrease Pain",            sub: "Burnout, trauma, chronic illness, anxiety, nervous system" },
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function CommunityBlueprint() {
  const [step, setStep] = useState("intro");
  const [card, setCard] = useState(0);
  const [a, setA] = useState({});
  const [statement, setStatement] = useState("");
  const [vision, setVision] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingVision, setGeneratingVision] = useState(false);
  const [phases, setPhases] = useState([
    { name: "", description: "" },
    { name: "", description: "" },
    { name: "", description: "" },
  ]);

  const set = (key, val) => setA(p => ({ ...p, [key]: val }));

  const addPhase = () => {
    if (phases.length < 7) setPhases(p => [...p, { name: "", description: "" }]);
  };
  const removePhase = (i) => {
    if (phases.length > 3) setPhases(p => p.filter((_, idx) => idx !== i));
  };
  const updatePhase = (i, key, val) => {
    setPhases(p => p.map((ph, idx) => idx === i ? { ...ph, [key]: val } : ph));
  };

  const handleGenerateStatement = async () => {
    setGenerating(true);
    try {
      const result = await generatePositioningStatement({
        category: CATEGORIES.find(c => c.id === a.category)?.label || a.category,
        person: a.person || "",
        bestResults: a.bestResults || "",
        alreadyTried: a.alreadyTried || "",
        pain: a.pain || "",
        belief: a.belief || "",
        result: a.result || "",
        timeframe: a.timeframe || "",
      });
      setStatement(result);
      setCard(5);
    } catch (e) {
      setStatement("Something went wrong. Please try again.");
      setCard(5);
    }
    setGenerating(false);
  };

  const handleGenerateVision = async () => {
    setGeneratingVision(true);
    try {
      const result = await generateVision({
        statement,
        person: a.person || "",
        category: CATEGORIES.find(c => c.id === a.category)?.label || a.category,
        clientPain: a.clientPain || "",
        clientWants: a.clientWants || "",
        phases: phases.map(p => p.name).filter(Boolean),
        result: a.result || "",
        timeframe: a.timeframe || "",
      });
      setVision(result);
    } catch (e) {
      setVision("Something went wrong generating your vision. Please try again.");
    }
    setGeneratingVision(false);
  };

  const s1Cards = ["hook", "category", "person", "pain", "result", "statement"];
  const s2Cards = ["pointA", "phases", "phasemap"];
  const s3Cards = ["scalable", "vision_ai", "cta"];
  const allCards = [...s1Cards, ...s2Cards, ...s3Cards];
  const totalCards = allCards.length;
  const currentCardName = allCards[card];
  const progressCard = card + 1;

  const next = () => {
    if (currentCardName === "result") { handleGenerateStatement(); return; }
    if (currentCardName === "scalable") { handleGenerateVision(); setCard(c => c + 1); return; }
    if (card < totalCards - 1) setCard(c => c + 1);
    else setStep("done");
  };

  const back = () => {
    if (card > 0) setCard(c => c - 1);
    else setStep("intro");
  };

  const canNext = () => {
    switch (currentCardName) {
      case "hook":       return true;
      case "category":   return !!a.category;
      case "person":     return a.person?.trim() && a.bestResults?.trim() && a.alreadyTried?.trim();
      case "pain":       return a.pain?.trim() && a.belief?.trim();
      case "result":     return a.result?.trim() && a.timeframe?.trim();
      case "statement":  return !!statement;
      case "pointA":     return a.clientWants?.trim() && a.clientPain?.trim();
      case "phases":     return phases.every(ph => ph.name.trim() && ph.description.trim());
      case "phasemap":   return true;
      case "scalable":   return true;
      case "vision_ai":  return !!vision;
      case "cta":        return true;
      default: return true;
    }
  };

  const wrap = (children) => (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: "#e8e4dc" }}>
      <style>{css}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 60px" }}>
        <ProgressBar current={progressCard} total={totalCards} />
        <div className="fu" key={card}>
          {children}
        </div>
      </div>
    </div>
  );

  // ── INTRO ──────────────────────────────────────────────────────────────────

  if (step === "intro") return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: "#e8e4dc", display: "flex", alignItems: "center" }}>
      <style>{css}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }} className="fu">
        <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
          Get Skooled — Community Blueprint
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
          Let's sketch your<br />
          <span style={{ color: ORANGE }}>Skool community</span><br />
          in 10 minutes.
        </div>
        <div style={{ fontSize: 13, color: "#666", lineHeight: 1.9, marginBottom: 32, borderLeft: `2px solid ${ORANGE}`, paddingLeft: 14 }}>
          You watched the video. You see what's possible.<br />
          Now let's make it real — for your specific coaching business.<br />
          <span style={{ color: "#888" }}>We'll generate your positioning statement and a personalized vision of your future business using AI.</span>
        </div>
        <button onClick={() => setStep("quiz")} style={{
          width: "100%", background: ORANGE, color: "#fff", border: "none",
          borderRadius: 8, padding: "16px", fontFamily: "'DM Sans',sans-serif",
          fontWeight: 500, fontSize: 14, letterSpacing: "0.04em", cursor: "pointer",
        }}>Build My Blueprint →</button>
        <div style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 12 }}>Takes about 10 minutes. No fluff.</div>
      </div>
    </div>
  );

  // ── QUIZ ───────────────────────────────────────────────────────────────────

  if (step === "quiz") {

    const renderCard = () => {
      switch (currentCardName) {

        case "hook": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 1 — Your Positioning</div>
            <Label sub="If your answer takes more than one sentence, this section is for you. Let's fix that.">
              Who do you help — and what do you help them do?
            </Label>
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "18px", marginTop: 8 }}>
              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                Most coaches can answer this question.<br />
                Almost none can answer it in a way that makes the right person stop scrolling.<br /><br />
                <span style={{ color: "#888" }}>By the end of this section, you'll have a positioning statement — written by AI, built from your inputs — that does exactly that.</span>
              </div>
            </div>
          </>
        );

        case "category": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 1 — Your Positioning</div>
            <Label sub="People move when a core emotional need is activated. Your niche must live inside one of these four categories.">
              What transformation do you deliver?
            </Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} className="cat-tile" onClick={() => set("category", cat.id)} style={{
                  background: a.category === cat.id ? "rgba(232,86,42,0.1)" : "#111",
                  border: `1px solid ${a.category === cat.id ? ORANGE : "#1e1e1e"}`,
                  borderRadius: 10, padding: "16px 14px", cursor: "pointer",
                  textAlign: "left", transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{cat.emoji}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700, color: a.category === cat.id ? "#fff" : "#aaa", marginBottom: 4 }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{cat.sub}</div>
                </button>
              ))}
            </div>
          </>
        );

        case "person": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 1 — Your Positioning</div>
            <Label sub="The more specific you are, the more magnetic your positioning becomes. Vague niches get ignored.">
              Tell me about your person.
            </Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>Who specifically do you help? (career, life stage, identity)</div>
                <TextArea value={a.person || ""} onChange={v => set("person", v)} placeholder="e.g. burnt-out therapists pivoting to coaching, high-performing moms with autoimmune issues..." rows={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>Who do you get your absolute best results with?</div>
                <TextArea value={a.bestResults || ""} onChange={v => set("bestResults", v)} placeholder="Think about your top 3 clients ever. What did they have in common?" rows={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>What have they already tried that hasn't worked?</div>
                <TextArea value={a.alreadyTried || ""} onChange={v => set("alreadyTried", v)} placeholder="Other coaches, therapy, courses, DIY attempts..." rows={2} />
              </div>
            </div>
          </>
        );

        case "pain": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 1 — Your Positioning</div>
            <Label sub="People don't buy transformation. They buy escape from pain and access to desire. Speak to both.">
              What are they running from?
            </Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>What's the visceral pain they're desperate to escape? Be specific.</div>
                <TextArea value={a.pain || ""} onChange={v => set("pain", v)} placeholder="e.g. waking up dreading their inbox, feeling like a fraud despite 10 years of experience..." rows={3} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>What's the story or belief keeping them stuck?</div>
                <TextArea value={a.belief || ""} onChange={v => set("belief", v)} placeholder="e.g. 'I need more certifications first', 'nobody will pay that much for what I do'..." rows={2} />
              </div>
            </div>
          </>
        );

        case "result": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 1 — Your Positioning</div>
            <Label sub="Numbers. Timeframes. Specific outcomes. The more concrete, the more credible.">
              What's the promised land you deliver?
            </Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>What's the specific, measurable result your clients achieve?</div>
                <TextArea value={a.result || ""} onChange={v => set("result", v)} placeholder="e.g. replace their 9-5 income, lose 20lbs of inflammation, go from 0 to first $10k month..." rows={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>In what timeframe?</div>
                <TextInput value={a.timeframe || ""} onChange={v => set("timeframe", v)} placeholder="e.g. 90 days, 6 months, 12 weeks..." />
              </div>
            </div>
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "14px", marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7 }}>
                ✦ Hit Next and we'll generate your positioning statement using AI.<br />
                <span style={{ color: "#444" }}>Takes about 5 seconds.</span>
              </div>
            </div>
          </>
        );

        case "statement": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Your Positioning Statement</div>
            {statement ? (
              <>
                <div style={{ background: "#111", border: `1px solid ${ORANGE}`, borderRadius: 12, padding: "28px 24px", marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Generated for you</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.15rem", fontWeight: 700, color: "#fff", lineHeight: 1.7 }}>
                    {statement}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                  This is your starting point — not a final draft. You'll refine this on your call and dial it in further through QX coaching. Screenshot it if you want to keep it.
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div className="pulse" style={{ fontSize: 11, color: ORANGE, letterSpacing: "0.12em" }}>Generating your statement...</div>
              </div>
            )}
          </>
        );

        case "pointA": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 2 — Your Phase Map</div>
            <Label sub="Before you map where you're taking them, nail down exactly where they're starting from. Point A is just as important as Point B.">
              Define your client's starting point.
            </Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>What does your client want most when they come to you?</div>
                <TextArea value={a.clientWants || ""} onChange={v => set("clientWants", v)} placeholder="The dream they're chasing, the desire underneath the pain..." rows={2} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>What does their day-to-day life actually look like before working with you?</div>
                <TextArea value={a.clientPain || ""} onChange={v => set("clientPain", v)} placeholder="Be specific. What are they waking up to? What's the loop they can't escape?" rows={3} />
              </div>
            </div>
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: "14px", marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#555" }}>
                Point B is your positioning statement:<br />
                <span style={{ color: "#888", fontStyle: "italic" }}>"{statement}"</span>
              </div>
            </div>
          </>
        );

        case "phases": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 2 — Your Phase Map</div>
            <Label sub="What are the major milestones between Point A and Point B? Each phase is a chunk of transformation. Minimum 3, maximum 7.">
              Map your signature system.
            </Label>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.7, marginBottom: 16, borderLeft: `2px solid ${ORANGE}`, paddingLeft: 10 }}>
              Think in phases, not steps. After each phase ask: <span style={{ color: "#888" }}>"What's the next problem they'll face?"</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phases.map((ph, i) => (
                <div key={i} className="phase-card" style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.12em", textTransform: "uppercase" }}>Phase {i + 1}</div>
                    {phases.length > 3 && (
                      <button onClick={() => removePhase(i)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                  <TextInput value={ph.name} onChange={v => updatePhase(i, "name", v)} placeholder={`Phase name — e.g. "Foundation", "Identity Shift", "The Offer"`} />
                  <div style={{ marginTop: 8 }}>
                    <TextArea value={ph.description} onChange={v => updatePhase(i, "description", v)} placeholder="What happens in this phase? What does the client DO, learn, or become?" rows={2} />
                  </div>
                </div>
              ))}
            </div>
            {phases.length < 7 && (
              <button onClick={addPhase} style={{
                marginTop: 10, width: "100%", background: "transparent",
                border: "1px dashed #2a2a2a", borderRadius: 8, padding: "12px",
                color: "#444", fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
              }}>+ Add Phase</button>
            )}
          </>
        );

        case "phasemap": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 2 — Your Phase Map</div>
            <Label>Here's what you just built.</Label>
            <div style={{ position: "relative", marginBottom: 24 }}>
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Point A</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{a.clientPain?.slice(0, 120) || "Your client's starting point"}{a.clientPain?.length > 120 ? "..." : ""}</div>
              </div>
              {phases.map((ph, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 1, height: 12, background: "#2a2a2a" }} />
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                    {i < phases.length - 1 && <div style={{ width: 1, flex: 1, background: "#2a2a2a", minHeight: 12 }} />}
                  </div>
                  <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 14px", flex: 1, marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{ph.name || `Phase ${i + 1}`}</div>
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>{ph.description?.slice(0, 100) || ""}{ph.description?.length > 100 ? "..." : ""}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 1, height: 12, background: "#2a2a2a" }} />
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e1e1e", border: `1px solid ${ORANGE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
                </div>
                <div style={{ background: "#111", border: `1px solid ${ORANGE}`, borderRadius: 10, padding: "12px 14px", flex: 1, marginTop: 12 }}>
                  <div style={{ fontSize: 10, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Point B — The Result</div>
                  <div style={{ fontSize: 12, color: "#e8e4dc", lineHeight: 1.6 }}>{statement?.slice(0, 120) || "Your promised transformation"}</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
              Each of these phases becomes its own course inside your Skool community — supported by templates, resources, and a custom GPT trained on your methodology.
            </div>
          </>
        );

        case "scalable": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Section 3 — The Skool Model</div>
            <Label>Each phase you just mapped becomes a module in your community.</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                { icon: "🎓", label: "A course", sub: "Video lessons walking members through each phase — so you stop re-teaching the same thing on every 1-on-1 call." },
                { icon: "📄", label: "Templates + resources", sub: "The exact frameworks, worksheets, and tools that make each phase actionable without needing your live presence." },
                { icon: "🤖", label: "A custom GPT", sub: "Trained on your methodology. Answers questions, coaches through obstacles, delivers your thinking at scale — 24/7." },
                { icon: "📞", label: "Group coaching calls", sub: "One call serves 15, 30, even 50+ people simultaneously. Every hotseat benefits the whole room. Your time stops being the bottleneck." },
              ].map((item, i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.7 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0f0f0f", border: `1px solid ${OB}`, borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 12, color: "#777", lineHeight: 1.9 }}>
                Now let's show you what this actually looks like — <span style={{ color: "#e8e4dc" }}>for your specific business.</span><br />
                <span style={{ color: "#555", fontSize: 11 }}>We're about to generate a personalized vision of your coaching business 90 days from now.</span>
              </div>
            </div>
          </>
        );

        case "vision_ai": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Your Future Business</div>
            <Label>90 days from now.</Label>
            {generatingVision ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div className="pulse" style={{ fontSize: 11, color: ORANGE, letterSpacing: "0.12em", marginBottom: 8 }}>Writing your vision...</div>
                <div style={{ fontSize: 11, color: "#333" }}>Painting a picture of your specific business.</div>
              </div>
            ) : vision ? (
              <>
                <div style={{ background: "#111", border: `1px solid ${ORANGE}`, borderRadius: 12, padding: "24px", marginBottom: 16 }}>
                  {vision.split("\n\n").filter(Boolean).map((para, i) => (
                    <p key={i} style={{
                      fontSize: 13, color: i === 0 ? "#e8e4dc" : i === 1 ? "#ccc" : "#aaa",
                      lineHeight: 1.9, marginBottom: i < vision.split("\n\n").length - 1 ? 16 : 0,
                      borderTop: i > 0 ? "1px solid #1a1a1a" : "none",
                      paddingTop: i > 0 ? 16 : 0,
                    }}>{para}</p>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#444", lineHeight: 1.7 }}>
                  This is what's possible. The blueprint is built. The vision is clear.
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 12, color: "#444" }}>Something went wrong. Hit Next to continue.</div>
              </div>
            )}
          </>
        );

        case "cta": return (
          <>
            <div style={{ fontSize: 10, color: ORANGE, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Your Blueprint</div>
            <Label>You just built the foundation of your Skool community.</Label>
            <div style={{ background: "#111", border: `1px solid ${ORANGE}`, borderRadius: 12, padding: "22px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>What you built today</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: ORANGE, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>Positioning Statement</div>
                    <div style={{ fontSize: 12, color: "#e8e4dc", lineHeight: 1.6, fontStyle: "italic" }}>{statement}</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Your {phases.length}-Phase System</div>
                  {phases.map((ph, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                      <span style={{ color: ORANGE, fontSize: 11, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: "#888" }}>{ph.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.9, marginBottom: 24 }}>
              The next step is turning this into a real Skool community — with the pricing, the funnel, the call structure, and the lead generation model that fills it.<br /><br />
              <span style={{ color: "#888" }}>That's what Anthony and Matthew do on a free strategy session. You bring this blueprint. They help you build the rest.</span>
            </div>
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" style={{
              display: "block", width: "100%", background: ORANGE, color: "#fff",
              border: "none", borderRadius: 8, padding: "16px",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
              fontSize: 14, textAlign: "center", textDecoration: "none",
              letterSpacing: "0.04em", cursor: "pointer",
            }}>Book a Free Strategy Session →</a>
            <div style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 10 }}>
              Anthony takes a limited number of these per week.
            </div>
          </>
        );

        default: return null;
      }
    };

    const isGeneratingCard = (currentCardName === "result" && generating) || (currentCardName === "vision_ai" && generatingVision);
    const hideNextBtn = currentCardName === "cta";
    const nextLabel = currentCardName === "result" ? "Generate My Statement →"
      : currentCardName === "scalable" ? "Generate My Vision →"
      : currentCardName === "vision_ai" ? "See My Blueprint →"
      : "Next →";

    return wrap(
      <>
        {renderCard()}
        {!hideNextBtn && !isGeneratingCard && (
          <NextBtn label={nextLabel} onClick={next} disabled={!canNext()} loading={false} />
        )}
        {isGeneratingCard && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div className="pulse" style={{ fontSize: 11, color: ORANGE, letterSpacing: "0.12em" }}>
              {currentCardName === "result" ? "Writing your positioning statement..." : "Generating your vision..."}
            </div>
          </div>
        )}
        {card > 0 && !hideNextBtn && !isGeneratingCard && (
          <div style={{ marginTop: 10 }}><BackBtn onClick={back} /></div>
        )}
      </>
    );
  }
}
