// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

// Make sure your .env.local file contains: OPENAI_API_KEY=sk-xxxxxxxx
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { ingredients } = req.body;

  if (!ingredients || ingredients.trim().length === 0) {
    return res.status(400).json({ error: "Missing ingredients text." });
  }

  const prompt = `
You are an expert in dietary ingredient compliance. Analyze the following ingredient list and return a JSON object with four keys: halal, vegan, kosher, and organic.

Each key should contain:
- status: "Compliant" or "Not Compliant"
- reason: a short 1-line explanation

Example format:
{
  "halal": { "status": "Compliant", "reason": "No forbidden ingredients" },
  "vegan": { "status": "Not Compliant", "reason": "Contains milk powder" },
  "kosher": { "status": "Compliant", "reason": "Meets kosher guidelines" },
  "organic": { "status": "Not Compliant", "reason": "No organic certification found" }
}

Ingredient list:
"""
${ingredients}
"""
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const rawText = completion.choices?.[0]?.message?.content;

    if (!rawText) {
      return res.status(500).json({ error: "No response from GPT." });
    }

    // Attempt to safely parse JSON
    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error("GPT error:", err.message);
    return res.status(500).json({ error: "Failed to analyze ingredients." });
  }
}
