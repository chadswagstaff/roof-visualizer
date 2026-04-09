# Metal Roof Visualizer — Deployment Guide

## Project structure
```
roof-visualizer/
├── api/
│   ├── analyze.js     ← GPT-4o roof detection
│   ├── generate.js    ← Replicate inpainting
│   ├── poll.js        ← Poll for result
│   └── lead.js        ← Save lead data
├── public/
│   └── index.html     ← The full app
├── vercel.json
└── package.json
```

---

## Step 1 — Put files on GitHub

1. Go to github.com and click **"New repository"**
2. Name it `roof-visualizer`, set it to **Private**, click **Create**
3. On your computer, create a folder called `roof-visualizer`
4. Copy all these files into it exactly as structured above
5. Open Terminal (Mac) or Command Prompt (Windows) in that folder and run:
```
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/roof-visualizer.git
git push -u origin main
```

---

## Step 2 — Deploy to Vercel (free)

1. Go to **vercel.com** and sign up with your GitHub account
2. Click **"Add New Project"**
3. Select your `roof-visualizer` repository
4. Click **Deploy** — Vercel auto-detects the config

---

## Step 3 — Add your API keys to Vercel

After deploying, go to your project in Vercel:
1. Click **Settings → Environment Variables**
2. Add these two variables:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | `sk-...` (your OpenAI key) |
| `REPLICATE_API_TOKEN` | `r8_...` (your Replicate token) |

3. Click **Save**, then go to **Deployments** and click **Redeploy**

Your app is now live at `https://roof-visualizer-xxx.vercel.app`

---

## Step 4 — Embed on your website

### Option A — Link to it (easiest)
Add a button on your site that links to your Vercel URL.

### Option B — Embed as iframe
Paste this anywhere on your website:
```html
<iframe 
  src="https://roof-visualizer-xxx.vercel.app" 
  width="100%" 
  height="900px" 
  frameborder="0"
  style="border-radius: 12px;">
</iframe>
```

### Option C — WordPress
Install the "Custom HTML" block and paste the iframe code above.

---

## Step 5 — Capture leads (optional upgrades)

Edit `api/lead.js` to forward leads anywhere:

**Zapier (no-code, connects to 5000+ apps):**
```js
await fetch('https://hooks.zapier.com/hooks/catch/YOUR_ID/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firstName, lastName, email, phone, roofStyle, roofColor })
});
```

**Email via SendGrid:**
```js
await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: [{ email: 'you@yourcompany.com' }],
    from: { email: 'noreply@yourcompany.com' },
    subject: `New Roof Lead: ${firstName} ${lastName}`,
    text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nStyle: ${roofStyle}\nColor: ${roofColor}`
  })
});
```

---

## Costs
- OpenAI GPT-4o vision: ~$0.02 per analysis
- Replicate inpainting: ~$0.05–0.15 per image
- Vercel hosting: **Free** on hobby plan
- **Total per lead: ~$0.10–0.20**
