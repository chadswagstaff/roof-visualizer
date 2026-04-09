export const config = { maxDuration: 30 };

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
        max_tokens: 1000,
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
              text: `Analyze this home photo. Return a JSON object only — no markdown, no explanation, no backticks, just raw JSON. The JSON must have these exact keys: roofDescription (string describing the roof shape and pitch), currentRoofMaterial (string), homeDescription (string), preserveElements (string listing what must not change: windows, doors, siding etc), roofPolygon (array of at least 8 objects each with x and y as numbers 0-100 representing percentage of image width and height, tracing the roof outline precisely). Example format: {"roofDescription":"gable roof","currentRoofMaterial":"asphalt shingles","homeDescription":"two story home","preserveElements":"windows, white siding, front door, landscaping","roofPolygon":[{"x":5,"y":45},{"x":50,"y":15},{"x":95,"y":45},{"x":95,"y":60},{"x":5,"y":60}]}`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      if (errText.includes('invalid_api_key')) return res.status(401).json({ error: 'Invalid OpenAI API key. Check your Vercel environment variables.' });
      if (errText.includes('insufficient_quota')) return res.status(402).json({ error: 'OpenAI quota exceeded. Add credits at platform.openai.com.' });
      return res.status(500).json({ error: 'OpenAI error: ' + errText });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';

    // Robust JSON extraction — find the first { and last }
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: 'GPT-4o did not return valid JSON. Try again.' });
    }

    const jsonStr = rawText.slice(start, end + 1);
    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse roof analysis. Try again.' });
    }

    // Validate roofPolygon exists and has enough points
    if (!analysis.roofPolygon || !Array.isArray(analysis.roofPolygon) || analysis.roofPolygon.length < 3) {
      // Return without polygon — generate.js will use fallback mask
      analysis.roofPolygon = null;
    }

    return res.status(200).json(analysis);
  } catch (err) {
    return res.status(500).json({ error: 'Roof analysis failed: ' + err.message });
  }
}
