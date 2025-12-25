# 🚀 Deployment Guide

## Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications. It's made by the creators of Next.js!

### Method 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial karaoke app"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable:
     - Key: `NEXT_PUBLIC_YOUTUBE_API_KEY`
     - Value: Your YouTube API key
   - Click "Deploy"

### Method 2: Deploy from CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables**:
   - In Vercel dashboard, go to your project
   - Settings → Environment Variables
   - Add `NEXT_PUBLIC_YOUTUBE_API_KEY`

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Deploy to Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Install Netlify CLI: `npm i -g netlify-cli`
   - Run: `netlify deploy --prod`
   - Set build directory to `.next`

3. **Set environment variables**:
   - In Netlify dashboard → Site settings → Environment variables
   - Add `NEXT_PUBLIC_YOUTUBE_API_KEY`

## Deploy to Your Own Server

1. **Build the production app**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

3. **Set up environment variables** on your server:
   ```bash
   export NEXT_PUBLIC_YOUTUBE_API_KEY=your_key_here
   ```

4. **Use PM2 for process management** (optional):
   ```bash
   npm i -g pm2
   pm2 start npm --name "karaoke" -- start
   pm2 save
   pm2 startup
   ```

## Deploy with Docker

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t karaoke-app .
   docker run -p 3000:3000 -e NEXT_PUBLIC_YOUTUBE_API_KEY=your_key karaoke-app
   ```

## Important Security Notes

### 🔐 API Key Security

- **Never commit** `.env.local` to version control
- In production, always set environment variables through your hosting platform
- Consider adding **API key restrictions** in Google Cloud Console:
  - Restrict by HTTP referrer (your domain)
  - Restrict to YouTube Data API v3 only

### 📊 API Quota Management

- Default quota: 10,000 units/day (free tier)
- Each search costs ~100 units
- Monitor usage in [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)
- Consider implementing:
  - Search result caching
  - Rate limiting
  - User authentication

## Performance Optimization

### Before Production Deployment:

1. **Optimize images**: Use Next.js Image component if adding custom images
2. **Enable compression**: Most hosting platforms do this automatically
3. **Set up CDN**: Vercel/Netlify handle this automatically
4. **Monitor performance**: Use Vercel Analytics or Google Analytics

## Testing Production Build Locally

Before deploying, test your production build:

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) and test all features.

## Post-Deployment Checklist

- [ ] YouTube API key is set correctly
- [ ] Search functionality works
- [ ] Videos play correctly
- [ ] Queue management works
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] API quota is sufficient for expected traffic

## Custom Domain Setup

### Vercel:
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Netlify:
1. Go to Site settings → Domain management
2. Add custom domain
3. Update DNS records

## Monitoring & Analytics

Consider adding:
- **Vercel Analytics**: Built-in for Vercel deployments
- **Google Analytics**: For user behavior tracking
- **Sentry**: For error tracking
- **LogRocket**: For session replay

## Need Help?

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)

---

🎉 **Ready to share your karaoke app with the world!**
