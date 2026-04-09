export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing prediction id' });

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Replicate poll error: ' + errText });
    }

    const data = await response.json();
    const output = data.status === 'succeeded'
      ? (Array.isArray(data.output) ? data.output[0] : data.output)
      : null;

    return res.status(200).json({
      status: data.status,
      output,
      error: data.error || null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Poll failed: ' + err.message });
  }
}
