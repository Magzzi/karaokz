# 🎤 Quick Reference Card

## 🚀 Essential Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm start               # Run production build
npm run lint            # Run ESLint

# Installation
npm install             # Install dependencies
npm install [package]   # Add new package
```

## 📋 Quick Setup (3 Steps)

1. **Get API Key**: [Google Cloud Console](https://console.developers.google.com/) → YouTube Data API v3
2. **Add to .env.local**: `NEXT_PUBLIC_YOUTUBE_API_KEY=your_key_here`
3. **Start Dev Server**: `npm run dev`

## 🎯 File Locations

| What | Where |
|------|-------|
| Main page | `app/page.tsx` |
| Player component | `components/YouTubePlayer.tsx` |
| Search component | `components/YouTubeSearch.tsx` |
| Queue component | `components/Queue.tsx` |
| YouTube API logic | `lib/youtube.ts` |
| Types | `types/youtube.ts` |
| API key | `.env.local` |
| Styles | `app/globals.css` |

## 🎨 Common Customizations

### Change Colors
Edit `app/page.tsx`:
```tsx
// Header gradient
from-purple-600 to-pink-600  // Change these colors

// Background gradient
from-purple-50 via-pink-50 to-blue-50  // Change these too
```

### Change Search Results Limit
Edit `lib/youtube.ts`:
```typescript
maxResults: '10'  // Change to 5, 15, 20, etc.
```

### Change Queue Order
Edit `app/page.tsx` in `handleVideoEnd`:
```typescript
const nextSong = updatedQueue[0];  // [0] = first, [1] = second, etc.
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key configuration error" | Check `.env.local` and restart server |
| "No videos found" | Try different search terms |
| Player not loading | Check browser console, try different browser |
| Build errors | Run `npm install` again |
| Port 3000 in use | Kill process or use different port |

## 🌐 Port Configuration

Change port (if 3000 is busy):
```bash
# Windows PowerShell
$env:PORT=3001; npm run dev

# Linux/Mac
PORT=3001 npm run dev
```

## 📦 Adding New Features

### Add a new component:
```bash
# Create file in components/
New-Item components/MyComponent.tsx

# Import in page.tsx
import MyComponent from '@/components/MyComponent';
```

### Add shadcn/ui component:
```bash
npx shadcn@latest add [component-name]
```

### Add new npm package:
```bash
npm install [package-name]
```

## 🎵 API Quota Reference

| Action | Cost (units) |
|--------|-------------|
| Search | 100 |
| Video details | 1 |
| Daily limit | 10,000 |
| Searches per day | ~100 |

## 📱 Testing Checklist

- [ ] Search works
- [ ] Add to queue works
- [ ] Play button works
- [ ] Remove button works
- [ ] Video plays
- [ ] Autoplay advances
- [ ] Mobile responsive
- [ ] No console errors

## 🚀 Deployment Quick Links

- **Vercel**: [vercel.com/new](https://vercel.com/new)
- **Netlify**: [app.netlify.com/start](https://app.netlify.com/start)
- **Google Cloud**: [console.cloud.google.com](https://console.cloud.google.com)

## 📞 Support Resources

- [Next.js Docs](https://nextjs.org/docs)
- [YouTube API Docs](https://developers.google.com/youtube/v3)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 💡 Pro Tips

1. **API Key**: Get it before starting
2. **Test First**: Run locally before deploying
3. **Git**: Commit often, `.env.local` is ignored
4. **Quota**: Monitor in Google Cloud Console
5. **Performance**: Test search speed and video loading
6. **Mobile**: Always test on actual mobile devices
7. **Backup**: Keep your API key in safe place

## 🎉 Ready to Go!

```bash
npm run dev
```
Open http://localhost:3000 and start singing! 🎤

---

**Need more help?** Check README.md, SETUP.md, or DEPLOYMENT.md
