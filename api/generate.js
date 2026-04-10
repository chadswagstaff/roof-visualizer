export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageDataUrl, prompt } = req.body;
  if (!imageDataUrl) return res.status(400).json({ error: 'Missing imageDataUrl' });
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const input = {
      prompt,
      image: imageDataUrl,
      magic_prompt_option: 'Off',
      style_type: 'Realistic',
    };

    const response = await fetch('https://api.replicate.com/v1/models/ideogram-ai/ideogram-v2/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      const errText = await response.text();
      if (errText.includes('invalid token') || errText.includes('Unauthenticated')) {
        return res.status(401).json({ error: 'Invalid Replicate API token. Check your Vercel environment variables.' });
      }
      return res.status(500).json({ error: 'Replicate error: ' + errText });
    }

    const data = await response.json();

    if (data.status === 'succeeded' && data.output) {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.status(200).json({ status: 'succeeded', output });
    }

    if (!data.id) {
      return res.status(500).json({ error: 'No prediction ID returned from Replicate. Check your API token.' });
    }

    return res.status(200).json({ predictionId: data.id, status: data.status });
  } catch (err) {
    return res.status(500).json({ error: 'Generation failed: ' + err.message });
  }
}
