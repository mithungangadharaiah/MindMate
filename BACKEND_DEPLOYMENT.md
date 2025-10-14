# 🚀 Backend Deployment Guide for MindMate

## ✅ Current Status
Your **frontend is now fully functional** with localStorage! The app works completely offline on GitHub Pages.

However, for **full AI analysis and multi-device sync**, you'll want to deploy the backend.

---

## 📋 Backend Deployment Options

### **Option 1: Render.com (Recommended - Free Tier Available)**

**Steps:**

1. **Sign up at [Render.com](https://render.com)**
   - Use your GitHub account to sign in

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `mithungangadharaiah/MindMate`
   - Select the repository

3. **Configure the service:**
   ```
   Name: mindmate-api
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Add Environment Variables:**
   Click "Environment" tab and add:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this
   DATABASE_URL=<will add after database setup>
   ```

5. **Deploy Database (PostgreSQL on Render):**
   - Create New → PostgreSQL
   - Name: `mindmate-db`
   - Select Free tier
   - Copy the "Internal Database URL"
   - Add it to your web service as `DATABASE_URL`

6. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - You'll get a URL like: `https://mindmate-api.onrender.com`

7. **Update Frontend:**
   - Edit `frontend/.env.production`:
     ```
     VITE_API_URL=https://mindmate-api.onrender.com
     ```
   - Commit and push
   - GitHub Actions will rebuild with new API URL

---

### **Option 2: Railway.app (Easy Setup)**

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `MindMate` repository

3. **Configure:**
   - Railway auto-detects Node.js
   - Set root directory: `backend`
   - Add environment variables in Settings

4. **Add PostgreSQL:**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway auto-links it to your service
   - `DATABASE_URL` is auto-set

5. **Get your URL:**
   - Go to Settings → Generate Domain
   - You'll get: `https://mindmate-api.up.railway.app`

6. **Update frontend `.env.production`** with the Railway URL

---

### **Option 3: Fly.io (Performance Focused)**

1. **Install Fly CLI:**
   ```powershell
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Navigate to backend and initialize:**
   ```powershell
   cd backend
   fly launch
   ```

3. **Follow prompts:**
   - Name: `mindmate-api`
   - Region: Choose closest
   - Database: Yes (PostgreSQL)

4. **Deploy:**
   ```powershell
   fly deploy
   ```

5. **Get URL:**
   ```powershell
   fly status
   ```
   URL will be: `https://mindmate-api.fly.dev`

6. **Update frontend `.env.production`**

---

### **Option 4: Azure App Service (Enterprise)**

1. **Install Azure CLI:**
   ```powershell
   winget install Microsoft.AzureCLI
   ```

2. **Login:**
   ```powershell
   az login
   ```

3. **Create Resource Group:**
   ```powershell
   az group create --name mindmate-rg --location eastus
   ```

4. **Create App Service Plan:**
   ```powershell
   az appservice plan create --name mindmate-plan --resource-group mindmate-rg --sku FREE
   ```

5. **Create Web App:**
   ```powershell
   az webapp create --resource-group mindmate-rg --plan mindmate-plan --name mindmate-api-unique
   ```

6. **Deploy from GitHub:**
   - Go to Azure Portal
   - Navigate to your Web App
   - Deployment Center → GitHub → Authorize → Select repo
   - Branch: main
   - Build provider: GitHub Actions

7. **Add Database:**
   - Create Azure Database for PostgreSQL
   - Add connection string to Web App Configuration

8. **URL will be:** `https://mindmate-api-unique.azurewebsites.net`

---

## 🔧 After Backend Deployment

### 1. Update Frontend Configuration

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
```

### 2. Push Changes
```powershell
git add frontend/.env.production
git commit -m "🔧 Update API URL to deployed backend"
git push origin main
```

### 3. Wait for GitHub Actions
- Build will complete in 2-3 minutes
- Your app will now use the real backend!

### 4. Test the Deployment
- Visit: https://mithungangadharaiah.github.io/MindMate/
- Record a voice session
- Check that data persists across sessions
- Data now syncs across devices!

---

## 🎯 Recommended: Render.com

**Why Render?**
- ✅ Free tier available
- ✅ Auto-deploys from GitHub
- ✅ Built-in PostgreSQL
- ✅ Easy SSL/HTTPS
- ✅ Great for Node.js
- ✅ No credit card needed for free tier

**Cost:**
- Free tier: Perfect for development/demo
- Paid tier: $7/month for production

---

## ❓ Need Help?

If you encounter issues:
1. Check backend logs on your hosting platform
2. Verify environment variables are set correctly
3. Ensure DATABASE_URL is properly configured
4. Check CORS settings in backend allow your GitHub Pages domain

---

## 🎉 Current State

**Your app is already working!** 
- ✅ Frontend deployed on GitHub Pages with HTTPS
- ✅ PWA features enabled (installable on mobile)
- ✅ Offline mode with localStorage
- ✅ All UI features functional

**With backend deployed:**
- 🤖 Real AI emotion analysis
- 💾 Cloud data storage
- 🔄 Multi-device sync
- 📊 Advanced analytics
- 🗣️ Better conversation AI

