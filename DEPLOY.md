# Realm of Ages — Deployment Guide

This guide gets the game live on the internet for **$0/month** using Render (free tier) and Neon PostgreSQL (free tier).

---

## Prerequisites (one-time setup, 10 minutes)

You need accounts at:
- [GitHub](https://github.com) — to host your code
- [Render](https://render.com) — to run the server
- [Neon](https://neon.tech) — for the PostgreSQL database

All three have free tiers. No credit card required for Neon. Render may ask for one but won't charge you on the free tier.

---

## Step 1 — Put the code on GitHub

If you haven't already:

```bash
cd realm-of-ages
git init
git add .
git commit -m "Initial commit — Realm of Ages"
```

Create a new repository at https://github.com/new, then push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/realm-of-ages.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create a Neon database (free)

1. Go to https://neon.tech and sign up (GitHub login works)
2. Click **"New project"**
3. Name it `realm-of-ages`
4. Choose a region close to you (US East, EU West, etc.)
5. Click **"Create project"**
6. On the dashboard, click **"Connection string"** and copy it

It looks like:
```
postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Save this string — you'll need it in Step 3.**

---

## Step 3 — Create a Render Web Service

1. Go to https://render.com and sign up (GitHub login works)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `realm-of-ages` repository
4. Configure the service:

| Field         | Value                                      |
|---------------|--------------------------------------------|
| Name          | `realm-of-ages`                            |
| Region        | Same as your Neon database region          |
| Branch        | `main`                                     |
| Build Command | `cd server && npm install`                 |
| Start Command | `npm start`                                |
| Instance Type | **Free**                                   |

5. Under **"Environment Variables"**, add:

| Key              | Value                                              |
|------------------|----------------------------------------------------|
| `NODE_ENV`       | `production`                                       |
| `DATABASE_URL`   | (paste the Neon connection string from Step 2)     |
| `SESSION_SECRET` | (generate one — see below)                         |

**To generate a SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as the value.

6. Click **"Create Web Service"**

Render will build and deploy. First deploy takes ~3 minutes.

---

## Step 4 — Initialize the database

Once deployed, you need to create the database tables. You have two options:

### Option A: Via Render Shell (easiest)

1. Go to your Render service dashboard
2. Click **"Shell"** in the left sidebar
3. Run:
```bash
npm run db:init
```

### Option B: Locally with the production DATABASE_URL

```bash
# Set the production DATABASE_URL in your local .env temporarily
DATABASE_URL=postgresql://... npm run db:init
```

You should see:
```
✅ Database initialized successfully.
   Tables: players, buildings, army, items, battle_log, event_log
```

---

## Step 5 — Verify it works

1. Visit your Render URL: `https://realm-of-ages.onrender.com`
2. The landing page should appear
3. Register an account
4. Choose a faction
5. Play the game

**Important:** The free Render tier sleeps after 15 minutes of inactivity. The first visit after a sleep takes ~30 seconds to wake up. This is normal and expected on the free tier.

---

## Step 6 (Optional) — Set up UptimeRobot to prevent sleeping

UptimeRobot pings your service every 5 minutes, keeping it awake. Free for up to 50 monitors.

1. Go to https://uptimerobot.com and create a free account
2. Click **"Add New Monitor"**
3. Select **"HTTP(s)"**
4. URL: `https://your-app.onrender.com/api/health`
5. Monitoring Interval: **5 minutes**
6. Click **"Create Monitor"**

This effectively eliminates cold starts **and** gives you uptime monitoring for free.

---

## Step 7 (Optional) — Custom domain

You don't need a custom domain to launch. Your app works fine at `yourapp.onrender.com`.

When you're ready:
1. Buy a domain at Namecheap (~$10/year for a `.com`) or use Cloudflare Registrar (at-cost)
2. In Render dashboard → your service → **"Settings"** → **"Custom Domains"**
3. Add your domain
4. Render gives you a CNAME value — add it in your domain registrar's DNS settings
5. SSL is automatic (Let's Encrypt, included free)

---

## Deploying updates

Every time you push to `main`, Render automatically rebuilds and redeploys:

```bash
git add .
git commit -m "your change description"
git push
```

Render shows deployment progress in the dashboard. Deploys typically take 1–2 minutes.

If a deploy breaks something, click **"Rollback"** in the Render dashboard to instantly revert to the previous working version.

---

## Environment Variables Reference

| Variable           | Required | Description                                           |
|--------------------|----------|-------------------------------------------------------|
| `NODE_ENV`         | Yes      | Set to `production`                                   |
| `SESSION_SECRET`   | Yes      | 64+ char random string. Generate with `crypto.randomBytes(64).toString('hex')` |
| `DATABASE_URL`     | Yes      | Neon PostgreSQL connection string                     |
| `PORT`             | No       | Render sets this automatically (don't set it)         |
| `TURN_REGEN_MINUTES` | No     | Minutes per turn (default: 2)                         |
| `TURN_MAX`         | No       | Turn cap per player (default: 200)                    |

---

## Monitoring

| What to watch       | Where to check                                      |
|---------------------|-----------------------------------------------------|
| Server uptime       | UptimeRobot dashboard (free)                        |
| Request logs        | Render dashboard → Logs                             |
| Database usage      | Neon dashboard → Monitoring                         |
| Error rate          | Render dashboard → Metrics                          |

**Neon free tier limits:**
- Storage: 0.5 GB (50 players use ~2 MB total — you have massive headroom)
- Compute: 191 compute hours/month (about 6 hours/day)
- If compute hours run out, the database sleeps until the month resets

---

## Scaling Plan

### Stage 1 — 0 to 50 players ($0/month)
Current setup. Nothing to change.

### Stage 2 — 50 to 500 players (~$7/month)
- Upgrade Render to **Starter** plan ($7/month) → no cold starts, more RAM
- Stay on Neon free tier (handles this easily)

### Stage 3 — 500 to 5,000 players (~$25/month)
- Render Starter → **Standard** if needed
- Upgrade Neon to Launch plan ($19/month) for more compute hours
- Consider adding Redis for session store (optional)

### Stage 4 — 5,000+ players
At this point you're generating revenue and infrastructure investment makes sense. The codebase requires no rewrite — just bigger managed services.

---

## Emergency Recovery

### "The site is down"
1. Check Render dashboard → is the service running?
2. Check logs for errors
3. If a bad deploy: click **Rollback** in Render
4. If database issue: check Neon dashboard

### "I accidentally deleted data"
Neon free tier has a 7-day restore window:
1. Neon dashboard → your project → **"Restore"**
2. Pick a timestamp before the deletion
3. Neon creates a branch at that point — copy data out

### "A player found a game-breaking bug"
The server is authoritative. No player can modify game state directly. To fix:
1. Push a fix to GitHub → auto-deploys in ~2 minutes
2. If urgent: manually edit the player's data in Neon's SQL editor

---

## Production Readiness Checklist

- [ ] Code pushed to GitHub
- [ ] Render service created and running
- [ ] Neon database created and `DATABASE_URL` set
- [ ] `npm run db:init` run successfully
- [ ] `SESSION_SECRET` set to a strong random value
- [ ] `NODE_ENV=production` set
- [ ] Can register a new account
- [ ] Can log in
- [ ] Page refresh keeps you logged in
- [ ] Can select a faction
- [ ] Can explore land
- [ ] Can build a building
- [ ] Can recruit units
- [ ] Can battle another player
- [ ] Can buy an auction item
- [ ] Rankings page shows players
- [ ] UptimeRobot monitor set up (optional but recommended)
- [ ] `/api/health` returns `{"ok":true}`
