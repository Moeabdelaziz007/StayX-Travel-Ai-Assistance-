import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
  }

  try {
    const query = `${destination} travel vlog 2025 4K`;
    const response = await fetch(
      `${YOUTUBE_SEARCH_URL}?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=19&order=rating&maxResults=6&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
        throw new Error(`YouTube API returned status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 });
    }

    const videos = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url,
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
