# Office Desk (MERN)

A simple web app for a CA / tax office to:
- record client documents coming in (Inward) and going back (Outward)
- track where each document is kept (Office → Cupboard → Row)
- assign tasks to staff and remind them by email

Built with **MongoDB, Express, React (Vite), Node.js** as an FSD subject project.

## Features (in progress)
- [x] Name-tile + PIN login (JWT), Boss / Staff roles
- [x] Clients
- [ ] Settings: staff, storage places, document & work types
- [ ] Inward / Outward entries and Documents register
- [ ] Tasks, My Work, Boss dashboard
- [ ] Daily reminders: in-app + email

## Run locally

**Server**
```bash
cd server
npm install
# create .env with PORT, MONGO_URI, JWT_SECRET
npm run seed     # demo users, PIN 2468
npm run dev      # http://localhost:5000
```

**Client**
```bash
cd client
npm install
npm run dev      # http://localhost:5173
```