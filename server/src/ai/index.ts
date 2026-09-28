/**
 * Part 6 — Mission AI Service
 * Streaming chat with Gemini, function calling, proactive briefings, shift report.
 */
import { GoogleGenAI, Type } from '@google/genai';
import { TOOL_DECLARATIONS, executeTool } from './tools.js';
import { Alert, Incident, Satellite, Telemetry } from '../models/index.js';
import { io } from '../index.js';

const AI_API_KEY = process.env.AI_API_KEY ?? '';
const AI_MODEL = process.env.AI_MODEL ?? 'gemini-2.0-flash';

const SYSTEM_INSTRUCTION = `You are Mission AI, the intelligent operator assistant for the Mission Control satellite operations platform.

Rules you must always follow:
1. Only use information from the provided tool results — never invent satellite data, alert details, or pass times.
2. Clearly state "Simulated telemetry — not real mission data" whenever discussing telemetry values.
3. Do NOT present illustrative runbooks as official procedures.
4. Be concise: lead with the direct answer, then provide the evidence.
5. When you need data to answer a question, use the available tools to fetch it.
6. When asked to focus on a satellite, call ui_focus_satellite.
7. For state-changing actions like acknowledging an alert, call the appropriate tool — the client will show a confirm card.

You have access to: satellite status, live telemetry windows, active alerts and incidents, pass predictions, space weather, conjunction screening, runbooks, and UI navigation commands.`;

let genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!AI_API_KEY) return null;
  if (!genai) {
    genai = new GoogleGenAI({ apiKey: AI_API_KEY });
  }
  return genai;
}

// ─── Proactive briefing (debounced per incident) ──────────────────────────────
const briefedIncidents = new Set<string>();
const BRIEF_DEBOUNCE_MS = 60_000;
const briefCooldowns = new Map<string, number>();

export async function generateIncidentBrief(incidentId: string, alertId: string): Promise<void> {
  const client = getClient();
  if (!client) return; // Offline mode — skip

  const now = Date.now();
  const lastBriefed = briefCooldowns.get(incidentId) ?? 0;
  if (now - lastBriefed < BRIEF_DEBOUNCE_MS) return;
  briefCooldowns.set(incidentId, now);

  try {
    const incident = await Incident.findById(incidentId).lean();
    const alert = await Alert.findById(alertId).lean();
    if (!incident || !alert) return;

    const prompt = `A new critical alert has been raised for NORAD ${alert.satelliteId}.
Alert: ${(alert as any).message}
Incident probable cause: ${incident.probableCause}
Evidence (telemetry snapshot): ${JSON.stringify((alert as any).evidence?.[0] ?? {}, null, 2)}

Generate a brief AI incident report covering: what happened, likely cause, what to check first, estimated impact, and recommended next steps. Keep it under 150 words.`;

    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const brief = response.text ?? '';
    io.emit('ai:incident_brief', { incidentId, alertId, brief });
  } catch (_) {
    // Quota or network error — skip gracefully
  }
}

// ─── Shift handover report ─────────────────────────────────────────────────────
export async function generateShiftReport(hoursBack = 8): Promise<string> {
  const since = new Date(Date.now() - hoursBack * 3_600_000);

  const [alerts, incidents, sats] = await Promise.all([
    Alert.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(50).lean(),
    Incident.find({ createdAt: { $gte: since } }).lean(),
    Satellite.find({ tier: 'fleet' }).select('noradId name health').lean(),
  ]);

  const summary = {
    period: `Last ${hoursBack} hours`,
    fleetHealth: sats.map((s) => ({ name: s.name, health: s.health })),
    alertCount: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    incidentCount: incidents.length,
    topAlerts: alerts.slice(0, 5).map((a) => `${a.severity}: ${(a as any).message}`),
  };

  const client = getClient();
  if (!client) {
    return `# Shift Handover Report (AI Offline Mode)\n\n**Period:** ${summary.period}\n\n**Fleet Health:** ${summary.fleetHealth.map((s) => `${s.name}: ${s.health}`).join(', ')}\n\n**Alerts:** ${summary.alertCount} total, ${summary.criticalAlerts} critical\n\n**Incidents:** ${summary.incidentCount}\n\n**Top Alerts:**\n${summary.topAlerts.map((a) => `- ${a}`).join('\n')}`;
  }

  try {
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: `Generate a structured shift handover report based on this mission data:\n${JSON.stringify(summary, null, 2)}\n\nFormat it as: Summary, Fleet Status, Key Events, Recommendations. Keep it professional and concise.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });
    return response.text ?? 'Report generation failed.';
  } catch (_) {
    return `# Shift Handover Report (generation failed — AI quota exceeded)\n\n${JSON.stringify(summary, null, 2)}`;
  }
}

// ─── Streaming chat handler ────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Stream a chat response to an Express SSE response object.
 * Handles multi-turn function calling loop.
 */
export async function streamChatResponse(
  history: ChatMessage[],
  userMessage: string,
  onToken: (token: string) => void,
  onToolCall: (chip: string, requiresConfirm?: boolean, uiCommand?: unknown) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const client = getClient();

  // ── Offline fallback ─────────────────────────────────────────────────────
  if (!client) {
    const offlineResponse = await generateOfflineResponse(userMessage);
    onToken('[AI Offline Mode] ');
    onToken(offlineResponse);
    onDone();
    return;
  }

  try {
    // Build contents array from history + new message
    const contents = [
      ...history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    // Multi-turn function calling loop (max 5 rounds to prevent infinite loops)
    let round = 0;
    const MAX_ROUNDS = 5;

    while (round < MAX_ROUNDS) {
      round++;

      const responseStream = await client.models.generateContentStream({
        model: AI_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        },
      });

      let fullText = '';
      const functionCallsThisRound: Array<{ name: string; args: Record<string, unknown> }> = [];

      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          onToken(chunk.text);
        }
        if (chunk.functionCalls) {
          for (const fc of chunk.functionCalls) {
            functionCallsThisRound.push({ name: fc.name ?? '', args: (fc.args as Record<string, unknown>) ?? {} });
          }
        }
      }

      if (functionCallsThisRound.length === 0) {
        // No function calls — we're done
        break;
      }

      // Execute all tool calls and collect results
      const functionResponses: Array<{ name: string; response: unknown }> = [];

      for (const fc of functionCallsThisRound) {
        const result = await executeTool(fc.name, fc.args);
        onToolCall(result.chip, result.requiresConfirm, result.uiCommand);
        functionResponses.push({ name: fc.name, response: result.data });
      }

      // Add model turn + function responses to contents for next round
      contents.push({
        role: 'model' as const,
        parts: functionCallsThisRound.map((fc) => ({
          functionCall: { name: fc.name, args: fc.args },
        })),
      });
      contents.push({
        role: 'user' as const,
        parts: functionResponses.map((fr) => ({
          functionResponse: { name: fr.name, response: fr.response },
        })),
      });
    }

    onDone();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown AI error';
    onError(msg);
  }
}

// ─── Offline fallback responder ───────────────────────────────────────────────
async function generateOfflineResponse(userMessage: string): Promise<string> {
  const lower = userMessage.toLowerCase();

  if (lower.includes('status') || lower.includes('health') || lower.includes('fleet')) {
    const sats = await Satellite.find({ tier: 'fleet' }).select('noradId name health').lean();
    const lines = sats.map((s) => `- **${s.name}** (NORAD ${s.noradId}): ${s.health}`);
    return `Fleet health summary (offline mode):\n\n${lines.join('\n')}`;
  }

  if (lower.includes('alert') || lower.includes('warning') || lower.includes('critical')) {
    const alerts = await Alert.find({ status: 'open' }).sort({ createdAt: -1 }).limit(5).lean();
    if (alerts.length === 0) return 'No open alerts at this time.';
    const lines = alerts.map((a) => `- **${a.severity?.toUpperCase()}** NORAD ${a.satelliteId}: ${(a as any).message}`);
    return `Open alerts (offline mode):\n\n${lines.join('\n')}`;
  }

  if (lower.includes('weather') || lower.includes('kp') || lower.includes('radiation')) {
    const { getCachedWeather } = await import('../services/spaceWeather.js');
    const w = getCachedWeather();
    return `Space weather (offline mode): Kp index **${w.kp.toFixed(1)}**, G-storm scale **G${w.stormScale}**.`;
  }

  if (lower.includes('iss') && lower.includes('pass')) {
    return 'Pass prediction requires the AI model. Please check /sky or use the satellite panel for next passes.';
  }

  return 'I am currently in offline mode. I can answer basic questions about fleet health, open alerts, and space weather. Ask me about those!';
}
