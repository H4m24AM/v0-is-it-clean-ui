// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Must be set in .env.local
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ingredients } = req.body;

  if (!ingredients) return res.status(400).json({ error: 'No ingredients provided' });

  const prompt = `
You are a dietary compliance assistant. Analyze the following ingredient list:

"${ingredients}"

Return a JSON object with four fields: halal, vegan, kosher, organic.
Each field should contain:
- "status": "Compliant" or "Not Compliant"
- "reason": short explanation (e.g., "Contains gelatin – often pork-based")

Respond in this exact JSON format:

{
  "halal": { "status": "...", "reason": "..." },
  "vegan": { "status": "...", "reason": "..." },
  "kosher": { "status": "...", "reason": "..." },
  "organic": { "status": "...", "reason": "..." }
}
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const json = completion.choices[0].message?.content;

    // Safely parse JSON from GPT
    const parsed = json ? JSON.parse(json) : null;

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error('GPT error:', error);
    res.status(500).json({ error: 'Failed to analyze ingredients' });
  }
}
