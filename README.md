# 🎤 Karaoke Night - Next.js Karaoke Web App

A modern, fully functional karaoke web application built with Next.js, TypeScript, and Tailwind CSS. Perfect for karaoke sessions with friends and family!

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)

## ✨ Features

### 🎵 Core Functionality
- **Split-Screen Layout**: Player on the left, queue on the right (responsive on mobile)
- **YouTube Search**: Find karaoke videos with title or artist search
- **Smart Queue Management**: Click to play, automatic progression, highlight current song
- **Autoplay**: Automatically plays the next song when current video ends
- **Auto-Remove**: Finished songs are removed from the queue

### 🎨 UI/UX
- **shadcn/ui Components**: Card, Button, Input, ScrollArea, Badge, Separator
- **Tailwind CSS Styling**: Modern gradient backgrounds, smooth transitions, hover effects
- **Responsive Design**: 
  - Desktop: Side-by-side split screen
  - Mobile/Tablet: Stacked layout with player on top
- **Karaoke-Friendly**: Clear text, large touch targets, easy navigation

### 🔍 Search Features
- YouTube Data API v3 integration
- Relevance-based ordering
- Music category filtering
- Display: thumbnails, titles, channel names, video duration
- Karaoke-optimized queries

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- YouTube Data API v3 key ([Get one here](https://console.developers.google.com/))

### Installation

1. **Clone and navigate to the project**:
```bash
cd karaok
```

2. **Install dependencies** (already done):
```bash
npm install
```

3. **Set up your YouTube API key**:
   
   Edit `.env.local` and replace `your_youtube_api_key_here` with your actual API key:
   ```env
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_actual_api_key
   ```

4. **Run the development server**:
```bash
npm run dev
```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key and paste it into `.env.local`
6. (Optional) Restrict the key to YouTube Data API v3 for security

## 🎯 Usage

1. **Search**: Type a song title or artist in the search box
2. **Add to Queue**: Click the "Add" button on any search result
3. **Play**: Click the play button on any queued song to start it immediately
4. **Automatic Playback**: Songs play automatically in queue order
5. **Remove**: Click the trash icon to remove a song from the queue

## 📁 Project Structure

```
karaok/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main karaoke page with state management
│   └── globals.css         # Global styles with Tailwind
├── components/
│   ├── YouTubePlayer.tsx   # YouTube IFrame Player with autoplay
│   ├── YouTubeSearch.tsx   # Search interface and results
│   ├── Queue.tsx           # Queue management component
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── youtube.ts          # YouTube API integration
│   └── utils.ts            # Utility functions
├── types/
│   └── youtube.ts          # TypeScript type definitions
└── .env.local              # Environment variables (API key)
```

## 🛠 Technical Stack

- **Framework**: Next.js 15.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **API**: YouTube Data API v3
- **State Management**: React hooks (useState, useCallback)

## 🎨 Key Features Explained

### YouTube Player Integration
- Uses YouTube IFrame Player API for better control
- Automatic video loading on queue changes
- Event handling for video end (triggers autoplay)

### Smart Queue System
- Unique queue IDs for each song (allows duplicates)
- Highlights currently playing song
- Auto-removes finished songs
- Click any song to play it immediately

### Search Optimization
- Adds "karaoke" to search queries
- Filters by music category (categoryId: 10)
- Fetches video duration from API
- Displays clean, scannable results

## 🚀 Production Deployment

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm start
```

### Deploy to Vercel:
```bash
npx vercel
```

## 🔐 Security Notes

- Never commit your `.env.local` file
- Restrict your YouTube API key to specific domains in production
- Consider adding rate limiting for API calls

## 📝 Optional Enhancements (Future)

- [ ] Dark mode toggle
- [ ] Singer name input per queue item
- [ ] Drag-and-drop queue reordering
- [ ] Fullscreen TV/projector mode
- [ ] Filter search results (instrumental, lyrics, etc.)
- [ ] Queue history and statistics
- [ ] Multiple user queues
- [ ] Share queue via URL

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this for your own karaoke parties!

## 🎉 Credits

Built with ❤️ using Next.js, shadcn/ui, and YouTube Data API.

---

**Ready to sing?** 🎤 Start the dev server and queue up your first song!
