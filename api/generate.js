export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageDataUrl, prompt } = req.body;
  if (!imageDataUrl || !prompt) return res.status(400).json({ error: 'Missing imageDataUrl or prompt' });

  try {
    const response = await fetch('https://api.replicate.com/v1/models/ideogram-ai/ideogram-v2/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt,
          image: imageDataUrl,
          magic_prompt_option: 'Off',
          style_type: 'Realistic'
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Replicate error: ' + err });
    }

    const prediction = await response.json();

    // If completed immediately
    if (prediction.status === 'succeeded') {
      const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return res.status(200).json({ predictionId: prediction.id, output, status: 'succeeded' });
    }

    return res.status(200).json({ predictionId: prediction.id, pollUrl: prediction.urls?.get });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
