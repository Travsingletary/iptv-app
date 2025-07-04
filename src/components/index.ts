// Original prop-based components (for backward compatibility)
export { ChatOverlay, ChatOverlayExample } from './ChatOverlay';
export { BetSlipModal, BetSlipModalExample } from './BetSlipModal';
export { ProgramDetailsPopup, ProgramDetailsPopupExample, mockProgram } from './ProgramDetailsPopup';

// Event-driven components (recommended)
export { 
  EventBusProvider, 
  useEventBus,
  ChatOverlayEventDriven,
  BetSlipModalEventDriven,
  ProgramDetailsPopupEventDriven,
  EventDrivenDemo
} from './EventDrivenComponents';

// Chat provider system
export { 
  ChatProviderManager, 
  useChatProvider,
  InternalChatProvider,
  DiscordChatProvider,
  DraftKingsChatProvider
} from './ChatProvider';
export type { 
  ChatProvider, 
  ChatMessage, 
  ChatProviderCapabilities 
} from './ChatProvider';

// Demo and testing components
export { SteadyStreamDemo } from './SteadyStreamDemo';
export { ComponentTest as ComponentAudit } from './ComponentAudit.test';

// TiviMate-style components
export { ChannelInfoBar, ChannelInfoBarExample } from './ChannelInfoBar';
export { MiniEPGGuide, MiniEPGGuideExample } from './MiniEPGGuide';
export { TiviMateDemo, TiviMateIntegrationGuide } from './TiviMateDemo';
export { 
  convertProgram, 
  convertChannel, 
  useTiviMateChannelData,
  createChannelChangedPayload,
  getProgramsForMiniEPG
} from './TiviMateAdapter';

// Types
export type { Program } from './ProgramDetailsPopup';
export type { EventType, EventPayloads } from './EventBusProvider';
export type { DraftKingsHook } from './BetSlipModalEventDriven';
export type { 
  Program as EPGProgram, 
  ChannelData, 
  CurrentNextPrograms, 
  ChannelChangedEvent 
} from './types/epg';

// Error handling
export { AppErrorBoundary } from './AppErrorBoundary';
export { useAsyncRetry } from '../hooks/useAsyncRetry';