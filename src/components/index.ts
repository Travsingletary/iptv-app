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

// Types
export type { Program } from './ProgramDetailsPopup';
export type { EventType, EventPayloads } from './EventBusProvider';
export type { DraftKingsHook } from './BetSlipModalEventDriven';