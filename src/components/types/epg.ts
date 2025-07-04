// Type definitions based on Agent 3's data structures
// These match the types from useEPGData hook and programUtils

export interface Program {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  category?: string;
  rating?: string;
}

export interface ChannelData {
  id: string;
  name: string;
  logo?: string;
  programs: Program[];
}

export interface CurrentNextPrograms {
  /** The program that's on air right now (or null if none) */
  current: Program | null;
  /** The very next upcoming program (or null if at end) */
  next: Program | null;
}

export interface ChannelChangedEvent {
  channel: Pick<ChannelData, 'id' | 'name'>;
  programs: CurrentNextPrograms;
}