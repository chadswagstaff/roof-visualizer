export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, phone, roofStyle, roofColor, timestamp } = req.body;

  console.log('NEW LEAD:', JSON.stringify({
    firstName, lastName, email, phone,
    roofStyle, roofColor,
    timestamp: timestamp || new Date().toISOString()
  }));

  // Uncomment to forward leads to Zapier, HubSpot, email, etc:
  // await fetch('https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ firstName, lastName, email, phone, roofStyle, roofColor })
  // });

  return res.status(200).json({ success: true });
}
