# Backend deployment instructions for Render.com

## Quick Deploy Steps:

1. Go to https://render.com and sign in with GitHub
2. Click "New +" → "Web Service"
3. Connect your repository: mithungangadharaiah/MindMate
4. Configure:
   - Name: mindmate-backend
   - Region: Oregon (US West) - or closest to you
   - Branch: main
   - Root Directory: backend
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Instance Type: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://mithungangadharaiah.github.io
   GEMINI_API_KEY=AIzaSyC34bRrVdXL9Y8Mw7_n8f4HSduUrmfNWOU
   GEMINI_MODEL=gemini-2.0-flash-exp
   JWT_SECRET=mindmate-production-secret-key-2024
   DEBUG_EMOTION_ANALYSIS=false
   LOG_LEVEL=info
   ```

6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment
8. Copy your backend URL (e.g., https://mindmate-backend.onrender.com)
9. Update frontend/.env.production with this URL
10. Push to GitHub to rebuild frontend

## Alternative: Manual deployment commands for other platforms

See BACKEND_DEPLOYMENT.md for detailed instructions.
