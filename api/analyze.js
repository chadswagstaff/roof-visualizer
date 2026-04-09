export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: `Analyze this home photo. Describe the roof area in precise detail: its shape, pitch, and the home's siding color, window placement, and any features that should NOT change. Return JSON only: { "roofDescription": "...", "currentRoofMaterial": "...", "homeDescription": "...", "preserveElements": "..." }`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'OpenAI error: ' + err });
    }

    const data = await response.json();
    let text = data.choices[0].message.content;
    text = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(text);
    return res.status(200).json(analysis);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
