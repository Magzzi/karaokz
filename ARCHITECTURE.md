# 🏗️ Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     KARAOKE WEB APP                         │
│                    (Next.js 15.1 + TypeScript)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌────────────────────┐
│   Client Browser │                    │  YouTube APIs      │
│   (React State)  │                    │                    │
└──────────────────┘                    └────────────────────┘
        │                                           │
        │                                           │
        │    ┌────────────────────────────────┐   │
        │    │   YouTube Data API v3          │◄──┘
        │    │   - Search videos              │
        │    │   - Get video details          │
        │    └────────────────────────────────┘
        │
        │    ┌────────────────────────────────┐
        │    │   YouTube IFrame Player API    │
        │    │   - Video playback             │
        │    │   - Event handling (onEnd)     │
        │    └────────────────────────────────┘
        │
        ▼
```

## Component Architecture

```
app/page.tsx (Main State Manager)
│
├─── State Management
│    ├── queue: QueueItem[]
│    ├── currentVideoId: string | null
│    └── currentQueueId: string | null
│
├─── Event Handlers
│    ├── handleAddToQueue(video)
│    ├── handlePlaySong(queueId)
│    ├── handleRemoveSong(queueId)
│    └── handleVideoEnd()
│
└─── Child Components
     │
     ├─── YouTubePlayer
     │    ├── Props: videoId, onVideoEnd
     │    ├── Uses: YouTube IFrame API
     │    └── Emits: onVideoEnd callback
     │
     ├─── YouTubeSearch
     │    ├── Props: onAddToQueue
     │    ├── Uses: lib/youtube.ts
     │    └── Emits: onAddToQueue(video)
     │
     └─── Queue
          ├── Props: queue, currentVideoId, onPlaySong, onRemoveSong
          └── Emits: onPlaySong(queueId), onRemoveSong(queueId)
```

## Data Flow

```
User Action → Component → State Update → UI Re-render

SEARCH FLOW:
───────────
User types query
      │
      ▼
YouTubeSearch component
      │
      ▼
lib/youtube.ts → YouTube Data API v3
      │
      ▼
Search results displayed
      │
      ▼
User clicks "Add"
      │
      ▼
onAddToQueue(video) → app/page.tsx
      │
      ▼
queue state updated
      │
      ▼
Queue component re-renders

PLAYBACK FLOW:
─────────────
User clicks Play OR video auto-ends
      │
      ▼
onPlaySong(queueId) OR handleVideoEnd()
      │
      ▼
currentVideoId state updated
      │
      ▼
YouTubePlayer receives new videoId
      │
      ▼
YouTube IFrame API loads video
      │
      ▼
Video plays automatically
      │
      ▼
Video ends → onVideoEnd callback
      │
      ▼
handleVideoEnd() → remove from queue → play next
```

## State Transitions

```
EMPTY STATE
│
│ User searches and adds song
▼
FIRST SONG IN QUEUE
│
│ Auto-plays immediately
▼
PLAYING + QUEUE HAS ITEMS
│
│ Video ends OR user clicks different song
▼
NEXT SONG PLAYING
│
│ Repeat until queue empty
▼
EMPTY STATE (loop)
```

## API Integration

```
┌─────────────────────────────────────────────┐
│           lib/youtube.ts                    │
├─────────────────────────────────────────────┤
│                                             │
│  searchYouTubeVideos(query)                │
│      │                                       │
│      ├─► Step 1: Search API                │
│      │   GET /youtube/v3/search            │
│      │   Params: q, type, categoryId       │
│      │   Returns: Video IDs, titles, etc.  │
│      │                                       │
│      ├─► Step 2: Videos API                │
│      │   GET /youtube/v3/videos            │
│      │   Params: id (video IDs)            │
│      │   Returns: Duration                  │
│      │                                       │
│      └─► Step 3: Combine & Parse           │
│          - Parse ISO 8601 duration          │
│          - Return YouTubeVideo[]            │
│                                             │
└─────────────────────────────────────────────┘
```

## Responsive Layout

```
DESKTOP (lg+)
┌──────────────────────────────────────────────┐
│              HEADER (Sticky)                 │
├─────────────────────┬────────────────────────┤
│                     │                        │
│   YOUTUBE PLAYER    │       QUEUE           │
│    (60% height)     │    (Full height)      │
│                     │                        │
├─────────────────────┤    - Song 1           │
│                     │    - Song 2           │
│   SEARCH PANEL      │    - Song 3 (Playing) │
│    (40% height)     │    - Song 4           │
│                     │                        │
└─────────────────────┴────────────────────────┘

MOBILE/TABLET (<lg)
┌──────────────────────────────────────────────┐
│              HEADER (Sticky)                 │
├──────────────────────────────────────────────┤
│                                              │
│           YOUTUBE PLAYER                     │
│          (16:9 aspect ratio)                 │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│           SEARCH PANEL                       │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│              QUEUE                           │
│           (Scrollable)                       │
│                                              │
└──────────────────────────────────────────────┘
```

## Type System

```
types/youtube.ts
│
├── YouTubeVideo
│   ├── id: string
│   ├── title: string
│   ├── channelName: string
│   ├── thumbnail: string
│   └── duration: string
│
├── QueueItem extends YouTubeVideo
│   ├── queueId: string (unique)
│   └── singerName?: string (optional)
│
├── YouTubeSearchResponse
│   └── items[]
│       ├── id.videoId
│       └── snippet
│
└── YouTubeVideoDetailsResponse
    └── items[]
        └── contentDetails.duration
```

## Environment Configuration

```
.env.local
│
└── NEXT_PUBLIC_YOUTUBE_API_KEY
    │
    ├─► Used by: lib/youtube.ts
    ├─► Required: Yes
    ├─► Type: Public (client-side)
    └─► Security: Domain restrictions recommended
```

## Dependencies Graph

```
package.json
│
├── Production Dependencies
│   ├── next (framework)
│   ├── react (UI library)
│   ├── react-dom (rendering)
│   ├── tailwindcss (styling)
│   ├── lucide-react (icons)
│   ├── class-variance-authority (component variants)
│   ├── clsx (class utilities)
│   └── tailwind-merge (class merging)
│
└── Development Dependencies
    ├── typescript (type checking)
    ├── @types/node
    ├── @types/react
    ├── @types/react-dom
    └── eslint (linting)
```

## Build Process

```
Source Code (TypeScript + React)
        │
        ▼
Next.js Compiler (Turbopack/Webpack)
        │
        ├─► Client Bundle (.next/static)
        ├─► Server Components
        └─► Route Handlers
        │
        ▼
Optimized Production Build
        │
        ├─► HTML pages
        ├─► JavaScript bundles
        ├─► CSS (Tailwind compiled)
        └─► Static assets
        │
        ▼
Deploy to Hosting (Vercel/Netlify/etc.)
```

## Performance Considerations

```
Optimizations Applied:
│
├── Client-side Rendering
│   └── Interactive components only
│
├── React Optimization
│   ├── useCallback (prevent re-renders)
│   └── Efficient state updates
│
├── API Efficiency
│   ├── Single search + details batch
│   └── Error handling
│
└── Future Optimizations
    ├── Search debouncing
    ├── Result caching
    ├── Image lazy loading
    └── Code splitting
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Unidirectional data flow
- ✅ Type safety throughout
- ✅ Efficient API usage
- ✅ Scalable component structure
- ✅ Responsive design
- ✅ Production-ready code
