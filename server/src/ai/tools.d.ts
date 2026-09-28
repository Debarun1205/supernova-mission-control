/**
 * Part 6 — Mission AI Tool Definitions
 * Each tool fetches live data from DB/simulation and returns compact JSON.
 */
import { type FunctionDeclaration } from '@google/genai';
export declare const TOOL_DECLARATIONS: FunctionDeclaration[];
export interface ToolResult {
    data: unknown;
    chip: string;
    requiresConfirm?: boolean;
    uiCommand?: {
        type: string;
        payload: unknown;
    };
}
export declare function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
//# sourceMappingURL=tools.d.ts.map