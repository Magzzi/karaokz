# 🎤 Quick Setup Guide

## Step 1: Get Your YouTube API Key

1. Visit [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Click **"Enable APIs and Services"**
4. Search for **"YouTube Data API v3"** and enable it
5. Go to **Credentials** → **"Create Credentials"** → **"API Key"**
6. Copy the generated API key

## Step 2: Configure Your API Key

1. Open `.env.local` file in the project root
2. Replace `your_youtube_api_key_here` with your actual API key:
   ```
   NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyC...your_key_here
   ```
3. Save the file

## Step 3: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎵 How to Use

1. **Search for a song**: Type artist or song name in the search box
2. **Add to queue**: Click the "Add" button next to any search result
3. **Play immediately**: Click the play button on any queued song
4. **Sit back**: Songs will automatically play in order and remove when finished

## 🔧 Troubleshooting

### "Failed to search. Please check your API key configuration."
- Make sure your API key is correctly set in `.env.local`
- Restart the dev server after changing `.env.local`
- Check that YouTube Data API v3 is enabled in your Google Cloud project

### No videos found
- Try different search terms
- Make sure you have an active internet connection
- Check if your API key has quota remaining (default is 10,000 units/day)

### Player not loading
- Check browser console for errors
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Check if YouTube is accessible in your region

## 📊 API Quota Usage

Each search uses approximately 100 quota units. The default daily quota is 10,000 units, which allows for about 100 searches per day.

## 🎉 Enjoy Your Karaoke Session!

The app is now ready for your karaoke party. Happy singing! 🎤🎶
