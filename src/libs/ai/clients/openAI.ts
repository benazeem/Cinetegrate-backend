import { InternalServerError } from '@middleware/error/index.js';

export async function openRouterAI(prompt: string): Promise<any> {
  const API_KEY = process.env.OPENROUTER_API_KEY;
  if (!API_KEY) throw new Error('Missing OpenRouter API key');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', 
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemma-4-31b-it:free',
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `
You are a strict JSON generator.

Rules:
- Output ONLY valid JSON
- No markdown
- No backticks
- No explanations
- No extra text

User request:
${prompt}
`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new InternalServerError('AI API error ', `(${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
}
