// Canvas Service Module - Barrel Export
// Provides clean imports for all Canvas-related functionality

// Main Canvas Service API
export { fetchCanvasCalendar, debugICSParsing } from '../canvasService';

// ICS Parser Module
export { parseICS, parseICSDate } from './icsParser';
export type { CanvasEvent } from './icsParser';

// Proxy Manager Module
export { fetchWithProxyFallback, retryCanvasOperation, CORS_PROXY_SERVICES } from './proxyManager';
export type { ProxyService } from './proxyManager';

// Canvas Security Module
export { CanvasSecurityUtils } from './canvasSecurity';
export type { UrlValidationResult } from './canvasSecurity';

// Task Converter Module
export { 
  convertEventToTask, 
  generateUserFriendlyClassName, 
  ensureClassExists, 
  getTaskTypeFromEvent 
} from './taskConverter';