export declare function generateIncidentBrief(incidentId: string, alertId: string): Promise<void>;
export declare function generateShiftReport(hoursBack?: number): Promise<string>;
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}
/**
 * Stream a chat response to an Express SSE response object.
 * Handles multi-turn function calling loop.
 */
export declare function streamChatResponse(history: ChatMessage[], userMessage: string, onToken: (token: string) => void, onToolCall: (chip: string, requiresConfirm?: boolean, uiCommand?: unknown) => void, onDone: () => void, onError: (msg: string) => void): Promise<void>;
//# sourceMappingURL=index.d.ts.map