# John's Call Log Dashboard

Receives webhooks from Vapi (Phillip AI assistant) and displays call transcripts.

## Setup

1. Create a new project on Vercel
2. Upload these files
3. Deploy
4. Copy the deployed URL (e.g., https://vercel.com/affiliate-media-hub-projects/john-call-tracker)
5. In Vapi dashboard, set the **Server URL** to: `https://your-app.vercel.app/api/webhook`
6. Done! Call logs will appear automatically.

## What It Does

- Catches every call Phillip answers
- Shows caller phone number, time, duration
- Displays full conversation transcript
- Auto-sorts calls: JOB / SPAM / FRIEND / OTHER
- Auto-refreshes every 5 seconds
- Works on your phone

## Note

Calls are stored in memory. If the app goes to sleep on Vercel's free tier, old calls may disappear. For permanent storage, add Vercel KV or a database later.
