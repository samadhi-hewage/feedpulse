interface GeminiAnalysis {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

export async function analyzeWithGemini(
  title: string,
  description: string
): Promise<GeminiAnalysis | null> {
  try {
    console.log('🤖 Gemini called with:', title);
    console.log('🔑 API Key exists:', !!process.env.GEMINI_API_KEY);

    const prompt = `Analyse this product feedback. Return ONLY valid JSON with no markdown, no backticks, just raw JSON.
Fields required:
- category: one of "Bug", "Feature Request", "Improvement", "Other"
- sentiment: one of "Positive", "Neutral", "Negative"
- priority_score: integer 1 (low) to 10 (critical)
- summary: one sentence summary under 20 words
- tags: array of 2-4 short relevant tags

Feedback title: "${title}"
Feedback description: "${description}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    const data = await response.json();
    console.log('📨 Gemini response:', JSON.stringify(data).slice(0, 200));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      category: parsed.category,
      sentiment: parsed.sentiment,
      priority_score: Math.min(10, Math.max(1, Number(parsed.priority_score))),
      summary: parsed.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch (err) {
    console.error('Gemini analysis failed:', err);
    return null;
  }
}