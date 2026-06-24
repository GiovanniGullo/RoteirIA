export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, system } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    const systemText = system || 'Você é um assistente especialista em viagens internacionais para brasileiros. Responda em português brasileiro, de forma amigável e objetiva. Máximo 220 palavras.';

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemText }] },
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        content: [{ type: 'text', text: `Erro ${response.status}: ${data?.error?.message || 'Tente novamente.'}` }]
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (error) {
    return res.status(200).json({ content: [{ type: 'text', text: 'Erro: ' + error.message }] });
  }
}
