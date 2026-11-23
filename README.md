# Office Desk (MERN)

A simple web app for a CA / tax office to:
- record client documents coming in (Inward) and going back (Outward)
- track where each document is kept (Office → Cupboard → Row)
- assign tasks to staff and remind them by email

Built with **MongoDB, Express, React (Vite), Node.js** as an FSD subject project.

## Features
- [x] Name-tile + PIN login (JWT), Boss / Staff roles
- [x] Clients
- [x] Settings: staff, storage places, document & work types
- [x] Inward / Outward entries and Documents register
- [x] Tasks, My Work, Boss dashboard
- [x] Daily reminders: in-app + email

## Run locally

**Server**
```bash
cd server
npm install
# create .env (see below) with PORT, MONGO_URI, JWT_SECRET
npm run seed     # demo users, PIN 2468
npm run dev      # http://localhost:5000
```

**Client**
```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

## Environment variables

Create `server/.env` (never commit it; `server/.env.example` shows the keys):

```env
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/officedesk?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=change-this-to-any-long-random-sentence

# Email reminders (pick one option, or leave both out and emails are skipped)

# Option A: real Gmail (needs 2-Step Verification + an App password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-letter-app-password
MAIL_FROM="Office Desk <yourname@gmail.com>"

# Option B: fake test inbox (Ethereal); a preview link prints in the server terminal
# EMAIL_TEST=1
```

## Demo login

After `npm run seed`, tap any name and use PIN **2468**. Log in again after every re-seed.