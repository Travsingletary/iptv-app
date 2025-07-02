import React from 'react';
import type { Program, ChannelData, CurrentNextPrograms, ChannelChangedEvent } from './types/epg';

// Convert Agent 3's Program to our internal format
export function convertProgram(program: Program): {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  category?: string;
  rating?: string;
  progress?: number;
} {
  const now = Date.now();
  const start = program.start.getTime();
  const end = program.end.getTime();
  
  // Calculate progress if currently airing
  let progress: number | undefined;
  if (start <= now && now < end) {
    const elapsed = now - start;
    const total = end - start;
    progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
  }
  
  return {
    id: program.id,
    title: program.title,
    startTime: program.start,
    endTime: program.end,
    description: program.description,
    category: program.category,
    rating: program.rating,
    progress,
  };
}

// Convert Agent 3's Channel to our format
export function convertChannel(channel: Pick<ChannelData, 'id' | 'name'>, number?: string): {
  id: string;
  number: string;
  name: string;
  logo?: string;
  quality?: 'HD' | 'FHD' | '4K' | 'SD';
  isRecording?: boolean;
  isFavorite?: boolean;
} {
  // Extract channel number from name if it contains one
  const extractedNumber = number || channel.name.match(/^(\d+)/)?.[1] || channel.id;
  
  // Determine quality based on channel name
  let quality: 'HD' | 'FHD' | '4K' | 'SD' = 'HD';
  if (channel.name.includes('4K')) quality = '4K';
  else if (channel.name.includes('FHD') || channel.name.includes('1080')) quality = 'FHD';
  else if (channel.name.includes('HD')) quality = 'HD';
  else if (channel.name.includes('SD')) quality = 'SD';
  
  return {
    id: channel.id,
    number: extractedNumber,
    name: channel.name,
    quality,
    // These would come from user preferences/state
    isFavorite: false,
    isRecording: false,
  };
}

// Adapter hook to use Agent 3's event data in TiviMate components
export function useTiviMateChannelData(event: ChannelChangedEvent | null) {
  if (!event) return null;
  
  const channel = convertChannel(event.channel);
  const currentProgram = event.programs.current 
    ? convertProgram(event.programs.current) 
    : null;
  const nextProgram = event.programs.next 
    ? convertProgram(event.programs.next) 
    : null;
  
  return {
    channel,
    currentProgram,
    nextProgram,
  };
}

// Updated EventBus payload converter
export function createChannelChangedPayload(event: ChannelChangedEvent) {
  const channelData = convertChannel(event.channel);
  
  return {
    channelId: channelData.id,
    channelName: channelData.name,
    channelNumber: channelData.number,
    // Include the full event data for components that need it
    fullEvent: event,
  };
}

// Helper to get programs for Mini EPG
export function getProgramsForMiniEPG(
  channelPrograms: Program[], 
  maxPrograms: number = 4
): Program[] {
  const now = Date.now();
  
  // Find current program index
  const currentIdx = channelPrograms.findIndex(
    p => p.start.getTime() <= now && now < p.end.getTime()
  );
  
  if (currentIdx >= 0) {
    // Return current + next programs
    return channelPrograms.slice(currentIdx, currentIdx + maxPrograms);
  }
  
  // If no current program, return upcoming programs
  const upcomingIdx = channelPrograms.findIndex(
    p => p.start.getTime() > now
  );
  
  if (upcomingIdx >= 0) {
    return channelPrograms.slice(upcomingIdx, upcomingIdx + maxPrograms);
  }
  
  // Return last programs if nothing upcoming
  return channelPrograms.slice(-maxPrograms);
}