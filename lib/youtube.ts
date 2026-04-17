import { google } from 'googleapis';

const youtube = google.youtube('v3');

export async function searchYouTubeVideos(query: string) {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not defined');
  }

  const res = await youtube.search.list({
    key: process.env.YOUTUBE_API_KEY,
    part: ['snippet'],
    q: query,
    maxResults: 5,
    type: ['video']
  });
  return res.data.items;
}
