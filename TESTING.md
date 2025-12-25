# 🧪 Testing Guide

## Pre-Launch Testing Checklist

### Environment Setup ✓
- [ ] Node.js 18+ installed
- [ ] npm packages installed (`npm install`)
- [ ] YouTube API key obtained
- [ ] `.env.local` file configured
- [ ] Dev server starts (`npm run dev`)

## Functional Testing

### 1. YouTube Search Feature

**Test Case 1.1: Basic Search**
- [ ] Open http://localhost:3000
- [ ] Type "Bohemian Rhapsody" in search box
- [ ] Click search button
- [ ] ✓ Results appear within 3 seconds
- [ ] ✓ Results show thumbnails, titles, channels, durations
- [ ] ✓ No console errors

**Test Case 1.2: Empty Search**
- [ ] Leave search box empty
- [ ] Try to click search
- [ ] ✓ Button is disabled
- [ ] ✓ No API call made

**Test Case 1.3: Search with Special Characters**
- [ ] Search: "Adele - Someone Like You"
- [ ] ✓ Results appear correctly
- [ ] ✓ Special characters handled properly

**Test Case 1.4: Invalid API Key**
- [ ] Remove API key from `.env.local`
- [ ] Restart server
- [ ] Try to search
- [ ] ✓ Error message displays
- [ ] ✓ User-friendly error text

### 2. Queue Management

**Test Case 2.1: Add to Queue**
- [ ] Search for a song
- [ ] Click "Add" button
- [ ] ✓ Song appears in queue
- [ ] ✓ Queue counter updates
- [ ] ✓ If first song, video starts playing automatically

**Test Case 2.2: Multiple Songs**
- [ ] Add 3-5 different songs
- [ ] ✓ All songs appear in queue
- [ ] ✓ Numbered correctly (1, 2, 3...)
- [ ] ✓ Thumbnails display properly

**Test Case 2.3: Add Same Song Twice**
- [ ] Add same song twice
- [ ] ✓ Both instances appear in queue
- [ ] ✓ Each has unique queue position

**Test Case 2.4: Remove from Queue**
- [ ] Add 3 songs to queue
- [ ] Click trash icon on second song
- [ ] ✓ Song removed
- [ ] ✓ Queue renumbers correctly
- [ ] ✓ Currently playing song unaffected

**Test Case 2.5: Remove Currently Playing**
- [ ] Play a song
- [ ] Remove it from queue
- [ ] ✓ Next song starts playing
- [ ] ✓ Removed song stops

### 3. Video Playback

**Test Case 3.1: Initial Play**
- [ ] Add first song to queue
- [ ] ✓ Video loads automatically
- [ ] ✓ Video plays immediately
- [ ] ✓ Controls are visible

**Test Case 3.2: Click to Play**
- [ ] Add 3 songs to queue
- [ ] Click play button on third song
- [ ] ✓ Third song starts playing immediately
- [ ] ✓ Highlighted as "Now Playing"

**Test Case 3.3: Autoplay Next**
- [ ] Add 2 songs to queue
- [ ] Let first song finish playing
- [ ] ✓ Second song starts automatically
- [ ] ✓ First song removed from queue
- [ ] ✓ Second song highlighted

**Test Case 3.4: Empty Queue State**
- [ ] Start with empty queue
- [ ] ✓ Empty state message displays
- [ ] ✓ Play icon visible
- [ ] ✓ Helpful text shown

### 4. UI/UX Testing

**Test Case 4.1: Currently Playing Indicator**
- [ ] Play a song
- [ ] ✓ Border color changes
- [ ] ✓ "Now Playing" badge visible
- [ ] ✓ Background highlighted

**Test Case 4.2: Button States**
- [ ] Check search button when input empty (disabled)
- [ ] Check search button when loading (spinner)
- [ ] Check play button on current song (hidden)
- [ ] ✓ All states work correctly

**Test Case 4.3: Hover Effects**
- [ ] Hover over queue items
- [ ] Hover over search results
- [ ] Hover over buttons
- [ ] ✓ Smooth transitions
- [ ] ✓ Visual feedback

**Test Case 4.4: Loading States**
- [ ] Search for a song
- [ ] ✓ Loading spinner appears
- [ ] ✓ Button shows loading state
- [ ] ✓ Results appear after loading

## Responsive Testing

### Desktop (1920x1080)
- [ ] ✓ Split-screen layout
- [ ] ✓ Player on left (60% height)
- [ ] ✓ Search below player (40%)
- [ ] ✓ Queue on right (full height)
- [ ] ✓ All content visible

### Laptop (1366x768)
- [ ] ✓ Split-screen maintained
- [ ] ✓ Scrolling works in queue
- [ ] ✓ Search results scrollable
- [ ] ✓ No layout breaks

### Tablet (768x1024)
- [ ] ✓ Stacked layout
- [ ] ✓ Player on top
- [ ] ✓ Search in middle
- [ ] ✓ Queue at bottom
- [ ] ✓ Touch targets large enough

### Mobile (375x667)
- [ ] ✓ Single column layout
- [ ] ✓ Player 16:9 aspect ratio
- [ ] ✓ Search interface usable
- [ ] ✓ Queue scrolls smoothly
- [ ] ✓ Buttons easy to tap

## Browser Testing

### Chrome
- [ ] ✓ All features work
- [ ] ✓ No console errors
- [ ] ✓ Smooth animations

### Firefox
- [ ] ✓ All features work
- [ ] ✓ Video plays correctly
- [ ] ✓ Styling consistent

### Safari
- [ ] ✓ All features work
- [ ] ✓ iOS compatibility
- [ ] ✓ Touch gestures work

### Edge
- [ ] ✓ All features work
- [ ] ✓ Windows compatibility
- [ ] ✓ No issues

## Performance Testing

### Load Times
- [ ] First page load < 3 seconds
- [ ] Search results < 2 seconds
- [ ] Video load start < 1 second
- [ ] Smooth scrolling (60fps)

### Memory Usage
- [ ] Check browser task manager
- [ ] Play 5+ videos in sequence
- [ ] ✓ No memory leaks
- [ ] ✓ Reasonable memory usage

### Network
- [ ] Monitor Network tab
- [ ] Search for songs
- [ ] ✓ API calls optimized
- [ ] ✓ No redundant requests

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all elements
- [ ] Enter to search
- [ ] Space to click buttons
- [ ] ✓ Logical tab order
- [ ] ✓ Focus indicators visible

### Screen Reader
- [ ] Test with screen reader
- [ ] ✓ Proper alt text
- [ ] ✓ Semantic HTML
- [ ] ✓ ARIA labels where needed

### Color Contrast
- [ ] Check text readability
- [ ] Check button contrast
- [ ] ✓ Meets WCAG AA standards

## Error Handling Testing

**Test Case: No Internet**
- [ ] Disconnect internet
- [ ] Try to search
- [ ] ✓ Proper error message

**Test Case: Invalid Video ID**
- [ ] Manually corrupt video ID in code
- [ ] ✓ Graceful failure
- [ ] ✓ User notified

**Test Case: API Quota Exceeded**
- [ ] Simulate quota error
- [ ] ✓ Clear error message
- [ ] ✓ No app crash

## Production Build Testing

```bash
# Build for production
npm run build

# Check for build errors
✓ No TypeScript errors
✓ No ESLint errors
✓ Build completes successfully

# Run production build
npm start

# Test all features again
✓ Everything works in production mode
```

## Security Testing

- [ ] ✓ `.env.local` not committed
- [ ] ✓ API key not exposed in client code (checked Network tab)
- [ ] ✓ No XSS vulnerabilities
- [ ] ✓ No sensitive data in console logs

## API Quota Testing

- [ ] Perform 10 searches
- [ ] Check Google Cloud Console quota
- [ ] ✓ Usage tracked correctly
- [ ] ✓ Within daily limits

## Edge Cases

**Test Case: Very Long Song Title**
- [ ] Search for song with 100+ char title
- [ ] ✓ Title truncates properly
- [ ] ✓ No layout break

**Test Case: No Search Results**
- [ ] Search: "xyzabc123nonsense"
- [ ] ✓ "No results" message
- [ ] ✓ App doesn't crash

**Test Case: Queue 20+ Songs**
- [ ] Add 20 songs to queue
- [ ] ✓ Scrolling works
- [ ] ✓ Performance acceptable
- [ ] ✓ All songs playable

**Test Case: Rapid Button Clicks**
- [ ] Click add/remove rapidly
- [ ] ✓ No duplicate adds
- [ ] ✓ No race conditions
- [ ] ✓ State stays consistent

## Pre-Deployment Checklist

- [ ] ✓ All functional tests pass
- [ ] ✓ Responsive on all devices
- [ ] ✓ Works in all major browsers
- [ ] ✓ No console errors
- [ ] ✓ Production build successful
- [ ] ✓ Environment variables configured
- [ ] ✓ API key restrictions set
- [ ] ✓ Performance acceptable
- [ ] ✓ Accessibility checks pass
- [ ] ✓ Error handling works
- [ ] ✓ Documentation complete

## Automated Testing (Future)

Consider adding:
- [ ] Jest for unit tests
- [ ] React Testing Library
- [ ] Playwright for E2E tests
- [ ] Lighthouse for performance

## Bug Report Template

```markdown
**Bug Description:**
[What happened?]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [And so on...]

**Expected Behavior:**
[What should happen?]

**Actual Behavior:**
[What actually happened?]

**Environment:**
- Browser: [Chrome/Firefox/Safari/Edge]
- OS: [Windows/Mac/Linux/iOS/Android]
- Screen Size: [1920x1080, etc.]

**Console Errors:**
[Paste any console errors]

**Screenshots:**
[If applicable]
```

---

## Testing Status: ✅ READY FOR TESTING

All components implemented and ready for comprehensive testing!
