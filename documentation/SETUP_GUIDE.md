# 🔗 SkillSwap Local Integration Guide

Step-by-step guide to run the complete SkillSwap platform locally with frontend connected to backend.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ Node.js (v14+) installed
- ✅ MongoDB installed and running
- ✅ Git installed
- ✅ Terminal/Command Prompt
- ✅ Code editor (VS Code recommended)

---

## 🗂️ Project Structure

Your project should look like this:

```
SkillSwap/
├── backend/                  # Backend folder
│   ├── node_modules/
│   ├── server.js
│   ├── seed.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
│
└── frontend/                 # Frontend folder
    ├── node_modules/
    ├── public/
    ├── src/
    │   ├── services/
    │   │   └── api.js       # API integration
    │   ├── App.js           # Main component
    │   └── index.js
    ├── package.json
    ├── .env
    └── .gitignore
```

---

## Part 1: Backend Setup (Terminal 1)

### Step 1: Create Backend Folder

```bash
mkdir SkillSwap
cd SkillSwap
mkdir backend
cd backend
```

### Step 2: Initialize Node Project

```bash
npm init -y
```

### Step 3: Install Dependencies

```bash
npm install express mongoose bcryptjs jsonwebtoken cors socket.io dotenv
npm install --save-dev nodemon
```

### Step 4: Update package.json

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  }
}
```

### Step 5: Create server.js

Copy the complete backend code from the artifacts I provided into `server.js`.

### Step 6: Create seed.js

Copy the seeder code into `seed.js`.

### Step 7: Create .env File

```bash
# Create .env file
cat > .env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOL
```

### Step 8: Start MongoDB

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB from Services or Command Prompt
```

### Step 9: Seed Database

```bash
npm run seed
```

You should see output with demo users created.

### Step 10: Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 SkillSwap Backend running on port 5000
📡 Socket.IO enabled for real-time chat
✅ MongoDB Connected
```

✅ **Keep this terminal running!** Backend is now live at `http://localhost:5000`

---

## Part 2: Frontend Setup (Terminal 2 - New Window)

### Step 1: Create React App

Open a **NEW terminal window** (keep backend running):

```bash
cd SkillSwap
npx create-react-app frontend
cd frontend
```

### Step 2: Install Additional Dependencies

```bash
npm install lucide-react socket.io-client
```

### Step 3: Create API Service

Create the services folder:

```bash
mkdir src/services
```

Create `src/services/api.js` and copy the API service code from the artifacts.

### Step 4: Create .env File

```bash
# In frontend folder, create .env
cat > .env << EOL
REACT_APP_API_URL=http://localhost:5000/api
EOL
```

### Step 5: Update App.js

Replace `src/App.js` with the connected frontend code from the artifacts.

### Step 6: Update src/index.js

Make sure it imports App correctly:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 7: Add Styling

Create `src/App.css` and copy the complete CSS code from the App.css artifact I provided.

Update `src/index.css`:

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
```

### Step 8: Start Frontend

```bash
npm start
```

Your browser should open automatically at `http://localhost:3000`

✅ **Frontend is running!** Keep this terminal running too.

---

## 🧪 Testing the Integration

Now you have **2 terminals running**:
- Terminal 1: Backend (port 5000)
- Terminal 2: Frontend (port 3000)

### Test 1: Login

1. Open browser at `http://localhost:3000`
2. Use demo credentials:
   - Email: `gitanjali@pesu.ac.in`
   - Password: `demo123`
3. Click Login

**Expected**: You should be redirected to the dashboard with skill matches.

### Test 2: View Matches

**Expected**: You should see other users (Harsimran, Navya, etc.) with their skills.

### Test 3: Send Connection Request

1. Click "Send Request" on any match
2. Open new **incognito window**
3. Login as that user (e.g., `harsimran@pesu.ac.in` / `demo123`)
4. You should see an incoming request
5. Click "Accept"

**Expected**: Request accepted, chat created.

### Test 4: Real-time Chat

1. Click "Chats" in navigation
2. Select the chat with the user you connected with
3. Send a message
4. In incognito window (still logged in as other user):
   - Go to Chats
   - Select same chat
   - You should see the message

**Expected**: Messages appear in real-time.

### Test 5: Admin Dashboard

1. Logout
2. Login as admin:
   - Email: `navya@pesu.ac.in`
   - Password: `demo123`
3. You should see admin dashboard

**Expected**: List of all users with verify buttons.

---

## 🐛 Troubleshooting

### Problem: Backend won't start

**Error**: `MongoNetworkError: failed to connect`

**Solution**:
```bash
# Check if MongoDB is running
brew services list  # macOS
systemctl status mongod  # Linux

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

### Problem: Frontend can't connect to backend

**Error**: `Failed to fetch` or CORS errors

**Solution**:
1. Check backend is running on port 5000
2. Check browser console for exact error
3. Verify `.env` in frontend has correct API_URL:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```
4. Restart frontend: `npm start`

### Problem: Login returns 401

**Error**: `Invalid credentials`

**Solution**:
1. Make sure you seeded the database:
   ```bash
   cd backend
   npm run seed
   ```
2. Try exact credentials: `gitanjali@pesu.ac.in` / `demo123`

### Problem: Changes not appearing

**Solution**:
```bash
# Clear browser cache
# Or use incognito mode

# Frontend: Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Backend: Check nodemon is running (auto-restart)
# If not, Ctrl+C and run: npm run dev
```

### Problem: Port already in use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find what's using the port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

---

## 📊 Verify Everything Works

### Backend Checklist

Test these endpoints with curl or Postman:

```bash
# Health check
curl http://localhost:5000/api/auth/me

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gitanjali@pesu.ac.in","password":"demo123"}'
```

### Frontend Checklist

- [ ] Login page loads
- [ ] Can login with demo account
- [ ] Dashboard shows matches
- [ ] Can send connection request
- [ ] Can accept requests
- [ ] Chat interface works
- [ ] Can logout
- [ ] Admin dashboard (for admin users)

---

## 🔍 Useful Commands

### View Backend Logs

Backend terminal shows all API requests:
```
POST /api/auth/login 200 45ms
GET /api/users/matches 200 12ms
```

### View MongoDB Data

```bash
# Open MongoDB shell
mongosh

# Switch to skillswap database
use skillswap

# View all users
db.users.find().pretty()

# Count users
db.users.countDocuments()

# View all requests
db.requests.find().pretty()
```

### Clear Database (Start Fresh)

```bash
cd backend
npm run seed  # This clears and reseeds
```

---

## 💡 Development Tips

### 1. VS Code Setup

Open both folders in VS Code:
```bash
code SkillSwap
```

Install recommended extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier
- ESLint
- MongoDB for VS Code

### 2. Keep Terminals Organized

Use VS Code's integrated terminal:
- Split terminal (Ctrl+Shift+5)
- Terminal 1: Backend
- Terminal 2: Frontend

### 3. Git Setup

```bash
# In SkillSwap root
git init
git add .
git commit -m "Initial commit"
```

Create `.gitignore` in root:
```
node_modules/
.env
*.log
.DS_Store
build/
```

---

## 🎯 Next Steps

Once everything works locally:

1. ✅ Test all features thoroughly
2. ✅ Customize UI/features for your project
3. ✅ Add your team members' details
4. ✅ Take screenshots for documentation
5. ✅ Follow the Deployment Guide to go live

---

## 📸 Demo Flow for Testing

### Scenario: Complete User Journey

**As Gitanjali (Frontend Developer):**
1. Register/Login
2. See Harsimran in matches (offers Backend skills)
3. Send connection request to Harsimran

**As Harsimran (Backend Developer):**
1. Login in incognito window
2. See incoming request from Gitanjali
3. Accept request
4. Go to Chats
5. Send message: "Hey! Let's exchange skills!"

**As Gitanjali:**
1. Go to Chats
2. See message from Harsimran
3. Reply: "Sounds great! I can teach React, you teach Node?"

**Result**: Peer-to-peer skill exchange initiated! ✨

---

## ✅ Success Indicators

You know it's working when:

- ✅ No errors in terminal
- ✅ Login redirects to dashboard
- ✅ Matches load from MongoDB
- ✅ Requests create notifications
- ✅ Chats update in real-time
- ✅ Admin can verify users
- ✅ JWT tokens persist on refresh

---

## 🎓 For Your Project Report

Include these details:

**Tech Stack:**
- Frontend: React.js, Tailwind CSS, Socket.io-client
- Backend: Node.js, Express.js, Socket.io
- Database: MongoDB with Mongoose
- Authentication: JWT + bcrypt
- Real-time: Socket.io

**API Endpoints:** (List from backend)
**Features:** (List all working features)
**Screenshots:** (Dashboard, Chat, Admin panel)

---

## 🚀 Ready for Deployment?

Once local testing is complete, follow the **DEPLOYMENT_GUIDE.md** to:
1. Deploy MongoDB to Atlas (Free)
2. Deploy Backend to Render (Free)
3. Deploy Frontend to Vercel (Free)

**Total time**: ~30 minutes
**Total cost**: $0

---

## 📞 Quick Reference

**Start Backend:**
```bash
cd backend && npm run dev
```

**Start Frontend:**
```bash
cd frontend && npm start
```

**Seed Database:**
```bash
cd backend && npm run seed
```

**Demo Login:**
- Email: gitanjali@pesu.ac.in
- Password: demo123

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

---

**You're all set! Start testing your SkillSwap platform! 🎉**