import { Channel, Program } from '../types/stream'

export const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    number: '1',
    name: 'SteadyNews',
    logo: '📰',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isActive: true,
  },
  {
    id: 'channel-2',
    number: '2', 
    name: 'SteadySports',
    logo: '⚽',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isActive: true,
  },
  {
    id: 'channel-3',
    number: '3',
    name: 'SteadyMovies',
    logo: '🎬',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isActive: true,
  },
  {
    id: 'channel-4',
    number: '4',
    name: 'SteadyMusic',
    logo: '🎵',
    streamUrl: '',
    isActive: false,
  },
]

const now = new Date()
const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

export const mockPrograms: Program[] = [
  // Channel 1 - News
  {
    id: 'program-1',
    channelId: 'channel-1',
    title: 'Evening News',
    description: 'Latest news and current events coverage with expert analysis.',
    startTime: oneHourAgo,
    endTime: oneHourFromNow,
    category: 'News',
    rating: 'TV-PG',
    isLive: true,
  },
  {
    id: 'program-2',
    channelId: 'channel-1',
    title: 'Weather Report',
    description: 'Local and national weather forecast.',
    startTime: oneHourFromNow,
    endTime: twoHoursFromNow,
    category: 'News',
    rating: 'TV-G',
    isLive: false,
  },
  
  // Channel 2 - Sports
  {
    id: 'program-3',
    channelId: 'channel-2',
    title: 'Premier League Match',
    description: 'Live football match: Manchester United vs Liverpool.',
    startTime: oneHourAgo,
    endTime: oneHourFromNow,
    category: 'Sports',
    rating: 'TV-PG',
    isLive: true,
  },
  {
    id: 'program-4',
    channelId: 'channel-2',
    title: 'Sports Center',
    description: 'Sports highlights and analysis.',
    startTime: oneHourFromNow,
    endTime: twoHoursFromNow,
    category: 'Sports',
    rating: 'TV-PG',
    isLive: false,
  },

  // Channel 3 - Movies
  {
    id: 'program-5',
    channelId: 'channel-3',
    title: 'The Matrix',
    description: 'A computer programmer discovers reality is a simulation.',
    startTime: oneHourAgo,
    endTime: twoHoursFromNow,
    category: 'Movie',
    rating: 'R',
    isLive: true,
  },
]