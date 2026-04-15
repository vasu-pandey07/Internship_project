# MERN Deployment and CI/CD Guide

This guide gives you a beginner-friendly but production-ready setup for:

- Frontend: React (Vite) on Vercel or Netlify
- Backend: Express API on Render, Railway, or AWS EC2
- Database: MongoDB Atlas
- CI/CD: GitHub Actions

## 1. Project Structure and Required Scripts

Expected structure:

```text
.
+-- .github/workflows/ci-cd.yml
+-- client/
¦   +-- .env.example
¦   +-- package.json
+-- server/
    +-- .env.example
    +-- Dockerfile
    +-- package.json
```

Important scripts:

- `client/package.json`
  - `npm run lint`
  - `npm run build`
- `server/package.json`
  - `npm run lint`
  - `npm test`
  - `npm start`
  - `npm run build` (placeholder for future transpile step)

## 2. Secure Environment Variable Handling

Do not commit real `.env` files.

Already configured:

- `server/.gitignore` ignores `.env`
- `client/.gitignore` ignores `.env`, `.env.*`, keeps `.env.example`

Use:

- `server/.env.example` for backend template
- `client/.env.example` for frontend template

## 3. MongoDB Atlas Setup

1. Create Atlas cluster.
2. Create DB user and password.
3. Network Access:
   - Add your backend egress IP(s), or temporary `0.0.0.0/0` for setup.
4. Copy connection URI into backend env:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/eduplatform?retryWrites=true&w=majority
```

## 4. CORS Setup (Frontend <-> Backend)

Backend reads `CLIENT_URL` and supports multiple domains (comma-separated):

```env
CLIENT_URL=https://app.example.com,https://staging-app.example.com
```

For local dev:

```env
CLIENT_URL=http://localhost:5173
```

Frontend should point to backend API:

```env
VITE_API_URL=https://api.example.com/api/v1
```

## 5. GitHub Actions CI/CD (Already Included)

Workflow file: `.github/workflows/ci-cd.yml`

On every push/PR:

1. Install backend deps
2. Run backend lint
3. Run backend tests
4. Install frontend deps
5. Run frontend lint
6. Build frontend

On push to `main`, deploy automatically when relevant secrets exist:

- Vercel (frontend)
- Netlify (frontend)
- Deploy Hook (Render or Railway backend)
- Optional EC2 SSH deploy

## 6. GitHub Secrets You Need

Repository -> Settings -> Secrets and variables -> Actions

Frontend (Vercel):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Frontend (Netlify):

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Backend (Render or Railway via deploy hook):

- `BACKEND_DEPLOY_HOOK_URL`

Backend (EC2 optional):

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_APP_DIR`

## 7. Frontend Deployment

### Option A: Vercel

1. Import repo in Vercel.
2. Root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env:

```env
VITE_API_URL=https://your-backend-domain.com/api/v1
```

Then add Vercel GitHub secrets so Actions can auto-deploy.

### Option B: Netlify

1. Import repo in Netlify.
2. Base directory: `client`
3. Build command: `npm run build`
4. Publish directory: `client/dist`
5. Add `VITE_API_URL` env variable.

Then add Netlify secrets to enable GitHub Actions deploy.

## 8. Backend Deployment

### Option A: Render

1. Create Web Service from GitHub repo.
2. Root directory: `server`
3. Build command: `npm ci`
4. Start command: `npm start`
5. Add backend env variables from `server/.env.example`.
6. Create Deploy Hook URL and set `BACKEND_DEPLOY_HOOK_URL` in GitHub secrets.

### Option B: Railway

1. Create project from GitHub repo.
2. Service root: `server`
3. Build command: `npm ci`
4. Start command: `npm start`
5. Add backend env variables.
6. If using Railway Deploy Hook, place URL in `BACKEND_DEPLOY_HOOK_URL`.

### Option C: AWS EC2 (with PM2)

On EC2 (Ubuntu):

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Clone and run:

```bash
git clone <your-repo-url>
cd <repo>/server
npm ci --omit=dev
pm2 start server.js --name eduplatform-api
pm2 save
```

Set environment variables for PM2 (via ecosystem file or shell export).

## 9. Optional Docker Backend Deployment

Build and run:

```bash
cd server
docker build -t eduplatform-server .
docker run --env-file .env -p 5000:5000 eduplatform-server
```

## 10. Optional Nginx Reverse Proxy (EC2)

`/etc/nginx/sites-available/eduplatform-api`:

```nginx
server {
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable config:

```bash
sudo ln -s /etc/nginx/sites-available/eduplatform-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

(Optional) Add SSL with Certbot.

## 11. Logging and Basic Monitoring

- Enable request logs by setting:

```env
LOG_HTTP=true
```

- Health endpoint:

```text
GET /api/health
```

- Add uptime monitor (UptimeRobot / Better Stack) pointing to:

```text
https://your-backend-domain.com/api/health
```

## 12. End-to-End Validation Checklist

1. Open frontend and verify pages load.
2. Confirm auth flows work.
3. Confirm frontend API requests hit production backend.
4. Check backend logs for CORS or env errors.
5. Verify MongoDB Atlas data is being written.
6. Trigger a push to `main` and confirm workflow jobs pass.
7. Confirm deployment job ran for your chosen platform.

## 13. Local Commands Reference

Backend local:

```bash
cd server
npm ci
npm run lint
npm test
npm run dev
```

Frontend local:

```bash
cd client
npm ci
npm run lint
npm run build
npm run dev
```
