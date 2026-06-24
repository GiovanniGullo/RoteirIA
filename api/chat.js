export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, system } = req.body;

    const systemText = system || 'Você é um assistente especialista em viagens internacionais para brasileiros. Responda em português brasileiro, de forma amigável e objetiva. Máximo 220 palavras por resposta.';

    const contents = [];
    for (const m of messages) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemText }] },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Google API error:', JSON.stringify(data));
      return res.status(500).json({ content: [{ type: 'text', text: 'Erro na API. Tente novamente.' }] });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui responder.';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ content: [{ type: 'text', text: 'Erro interno. Tente novamente.' }] });
  }
}
