# VPS Beginner Guide For `garudsamachar.garudstacks.tech`

This project can run fully on your KVM4 VPS without Railway or Vercel.

## What KVM4 means

- KVM4 is your VPS plan.
- You can think of it as your own Ubuntu computer on the internet.
- We will log into it using SSH, upload the project, run the backend with PM2, and serve the frontend using Nginx.

## Final architecture

- Domain: `garudsamachar.garudstacks.tech`
- Frontend: static Vite build served by Nginx
- Backend: Node.js app on port `3001`
- Process manager: PM2
- Reverse proxy: Nginx
- Database: MongoDB Atlas
- Media: Cloudinary

## DNS requirement

In your domain DNS panel, point:

- Type: `A`
- Host/Name: `garudsamachar`
- Value: `YOUR_VPS_IP`

After DNS propagation, the domain will open your VPS.

## Recommended production env

### Backend

```env
PORT=3001
NODE_ENV=production
MONGO_URI=your_mongodb_uri
MONGODB_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=https://garudsamachar.garudstacks.tech
MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
```

### Frontend

```env
VITE_API_BASE_URL=/api
VITE_API_FALLBACK_URL=
VITE_API_TIMEOUT_MS=12000
```

## Safe deployment order

1. Connect to VPS with SSH.
2. Check existing PM2 and Nginx configs.
3. Create `/var/www/news-portal`.
4. Upload and extract code there.
5. Install backend and frontend dependencies.
6. Create backend `.env`.
7. Build frontend.
8. Start backend with PM2.
9. Add isolated Nginx config.
10. Test Nginx.
11. Enable site and reload Nginx.
12. Issue SSL with Certbot.
13. Run smoke tests.

## Important rule

If another live project already exists on the VPS, never use destructive commands such as:

- `pm2 delete all`
- `rm -rf /var/www`
- deleting default Nginx configs without checking first

Always create a separate path and separate PM2 app for this project.
