# MiniCord Production Cloud Deployment Guide

This guide details how to deploy MiniCord in a production environment using modern cloud services: **MongoDB Atlas** for database persistence, **Render** (or Railway/Fly.io) for the Express + Socket.IO backend, and **Vercel** (or Netlify) for the React frontend.

---

## 1. Database Deployment: MongoDB Atlas

Since Prisma requires a MongoDB replica set for transaction support, we use **MongoDB Atlas** which provides a fully managed MongoDB cluster with replica sets configured out of the box.

1. Sign up/log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project, then select **Build a Database** and choose the **M0 Free Tier** cluster.
3. Select your preferred Cloud Provider and Region (e.g., AWS / N. Virginia) and click **Create Cluster**.
4. In the **Security Quickstart**:
   - Create a database user (e.g., username: `minicord-admin`, generate a strong password).
   - Under **IP Access List**, select **Allow Access from Anywhere** (`0.0.0.0/0`) since cloud backend services like Render dynamic IPs need database access. Alternatively, if your hosting provider supports static IPs, add those specific IPs.
5. Once the cluster is deployed, click **Connect** -> **Drivers** -> **Node.js** to retrieve your connection string.
6. Your connection string will look like this:
   ```text
   mongodb+srv://minicord-admin:<password>@cluster0.xxxx.mongodb.net/minicord?retryWrites=true&w=majority
   ```
   *(Be sure to replace `<password>` with your database user password, and set the database name to `/minicord` before query parameters).*

---

## 2. Backend Deployment: Render.com

Render is an excellent option for the backend because it natively supports WebSockets and has simple Docker support.

1. Sign up/log in to [Render](https://render.com).
2. Click **New +** and choose **Web Service**.
3. Connect your GitHub repository containing the MiniCord project.
4. Configure the Web Service settings:
   - **Name:** `minicord-backend`
   - **Root Directory:** `backend` (if repo is monorepo) or leave empty if repository contains backend code only.
   - **Runtime:** `Docker` (Render will automatically detect the `Dockerfile` inside the root or specified directory).
   - **Region:** Choose a region closest to your users.
   - **Branch:** `main` or your active production branch.
   - **Instance Type:** Select the Free or Starter tier.
5. Expand **Advanced** and add the following **Environment Variables**:
   - `DATABASE_URL`: Your MongoDB Atlas connection string (obtained in Step 1).
   - `PORT`: `3000` (or leave empty as Render defines `PORT` automatically).
   - `JWT_SECRET`: A long, randomly generated secret string (e.g., `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`).
   - `FRONTEND_ORIGIN`: The URL of your production frontend (e.g., `https://minicord.vercel.app`).
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will build the Docker container and deploy it.
7. Note down the deployed service URL (e.g., `https://minicord-backend.onrender.com`).

---

## 3. Frontend Deployment: Vercel

Vercel is the recommended hosting platform for React/Vite SPAs.

1. Sign up/log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure the Project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `tsc -b && vite build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   - `VITE_BACKEND_URL`: Your production backend URL (e.g., `https://minicord-backend.onrender.com` - *do not add a trailing slash*).
6. Click **Deploy**. Vercel will install dependencies, compile the client, and serve the static bundle with CDN caching.

---

## 4. Local Deployment with Docker Compose

To test the entire containerized setup locally (including replica sets):

1. Make sure Docker Desktop is installed and running.
2. Run the following command in the root of the project:
   ```bash
   docker compose up --build -d
   ```
3. Once running, you can access:
   - **Frontend UI:** `http://localhost` (port 80)
   - **Backend API:** `http://localhost:3000`
   - **MongoDB Database:** `mongodb://localhost:27017`
4. Run the seed script inside the running backend container to populate sample users:
   ```bash
   docker compose exec backend npm run seed
   ```
