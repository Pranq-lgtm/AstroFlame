'use client';

import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  X,
  Send,
  Sliders,
  Database,
  ExternalLink,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import {
  useAstroFlame,
  type TelemetryActionInput,
} from '@/frontend/context/astroflame-context';
import { PERSONA_LENSES } from '@/backend/psi-datasets';
import {
  buildDeterministicSynthesis,
  buildRecommendedTelemetryActions,
} from '@/backend/si-synthesis-engine';

interface CitedDatasetBadge {
  id: string;
  psiId: string;
  title: string;
  doi: string;
  url: string;
}

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  citedDatasets?: CitedDatasetBadge[];
  telemetryActions?: TelemetryActionInput[];
}

const STARTER_PROMPTS = [
  'Why does 0.16g Lunar gravity lower LOC at 34% O₂ (FM2 / LUCI)?',
  'Why do N₂ jets fail on thick PMMA in BASS-II until HVAC is cut to 0 cm/s?',
  'How do 500–1000 K cool flames re-ignite at up to 85% O₂ in CFI-G?',
  'How does SAME 0.00g smoke coagulation affect spacecraft fire alarms?',
];

export default function SiChatbotDrawer() {
  const {
    isCopilotOpen,
    setIsCopilotOpen,
    personaRole,
    activeDataset,
    setActiveDatasetId,
    chamberParams,
    applyTelemetryAction,
  } = useAstroFlame();

  const currentLens =
    PERSONA_LENSES.find((p) => p.id === personaRole) || PERSONA_LENSES[0];

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedActionId, setAppliedActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const msgCounterRef = useRef<number>(1);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      timestamp: 'LIVE',
      model: 'gemini-4-hydrogen',
      content: `### AstroFlame SI Copilot (**Gemini 4 Hydrogen**)

I am grounded in **16 NASA Physical Sciences Informatics (PSI)** microgravity combustion investigations and synchronized with your live chamber telemetry (**[${activeDataset.psiId}] ${activeDataset.shortTitle}**).

Ask me about **low-velocity microgravity ventilation (BASS-II)**, **34% O₂ Lunar cabin flammability (FM2/LUCI)**, **500–1000 K cool flames up to 85% O₂ (FLEX/CFI-G)**, or **smoke aerosol coagulation (SAME)**—or click a **One-Click Telemetry Action** below to configure the 3D chamber directly.`,
      citedDatasets: [
        {
          id: 'bass-ii-psi-25',
          psiId: 'PSI-25',
          title: 'BASS-II: Burning and Suppression of Solids - II',
          doi: '10.60555/4qc4-de67',
          url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
        },
        {
          id: 'fm2-lunar-clps',
          psiId: 'CLPS-FM2',
          title: 'FM2: Flammability of Materials on the Moon',
          doi: '10.2514/6.2024-fm2-clps',
          url: 'https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/',
        },
      ],
      telemetryActions: [
        {
          id: 'init-lunar-fm2',
          label: 'Apply Lunar 34% O₂ Worst-Case (0.16g)',
          description: 'Sets 0.16g Lunar gravity, 34% O₂, 12.0 cm/s draft & loads CLPS-FM2',
          datasetId: 'fm2-lunar-clps',
          gravityG: 0.16,
          oxygenPercent: 34,
          airflowCmPerSec: 12.0,
          eFieldKv: 0.0,
          coolFlameMode: false,
          provenanceMode: 'psi_experimental',
        },
        {
          id: 'init-cfig-cool',
          label: 'Engage 500–1000 K Cool Flame at 85% O₂ (CFI-G)',
          description: 'Switches to 0.00g, 85% O₂, 1.5 cm/s flow, Cool Flame NTC & loads PSI-159',
          datasetId: 'acme-cfi-g-psi-159',
          gravityG: 0.0,
          oxygenPercent: 85,
          airflowCmPerSec: 1.5,
          eFieldKv: 0.0,
          coolFlameMode: true,
          provenanceMode: 'psi_experimental',
        },
      ],
    },
  ]);

  useEffect(() => {
    if (isCopilotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCopilotOpen]);

  const handleSendMessage = async (customText?: string) => {
    const promptText = (customText ?? input).trim();
    if (!promptText || isLoading) return;

    msgCounterRef.current += 1;
    const turnIndex = msgCounterRef.current;

    const userMsg: CopilotMessage = {
      id: `user-${turnIndex}`,
      role: 'user',
      content: promptText,
      timestamp: `TURN #${turnIndex}`,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/si/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          personaRole,
          history: nextMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          chamberContext: {
            activeDatasetId: activeDataset.id,
            gravityG: chamberParams.gravityG,
            oxygenPercent: chamberParams.oxygenPercent,
            airflowCmPerSec: chamberParams.airflowCmPerSec,
            eFieldKv: chamberParams.eFieldKv,
            coolFlameMode: chamberParams.coolFlameMode,
            provenanceMode: chamberParams.provenanceMode,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      msgCounterRef.current += 1;
      const replyIndex = msgCounterRef.current;
      const assistantMsg: CopilotMessage = {
        id: `assistant-${replyIndex}`,
        role: 'assistant',
        content:
          data.reply ||
          'Unable to synthesize response at this moment. Please try again.',
        timestamp: `TURN #${replyIndex}`,
        model: data.model || 'gemini-4-hydrogen',
        citedDatasets: data.citedDatasets || [],
        telemetryActions: data.telemetryActions || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const fallback = buildDeterministicSynthesis(promptText, personaRole);
      const fallbackActions = buildRecommendedTelemetryActions(promptText);
      msgCounterRef.current += 1;
      const errIndex = msgCounterRef.current;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${errIndex}`,
          role: 'assistant',
          content: fallback.synthesis,
          timestamp: `TURN #${errIndex}`,
          model: 'gemini-4-hydrogen',
          citedDatasets: fallback.citedDatasets,
          telemetryActions: fallbackActions,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAction = (action: TelemetryActionInput) => {
    applyTelemetryAction(action);
    setAppliedActionId(action.id);
    window.setTimeout(() => {
      setAppliedActionId((prev) => (prev === action.id ? null : prev));
    }, 3000);
  };

  const handleResetChat = () => {
    setMessages((prev) => [prev[0]]);
  };

  return (
    <>
      {/* Floating Launcher Button (Accessible Across All Tabs) */}
      {!isCopilotOpen && (
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          aria-label="Open Gemini 4 Hydrogen SI Copilot"
          className="fixed bottom-16 lg:bottom-6 right-5 z-40 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold text-xs font-mono shadow-xl border border-sky-300/40 flex items-center gap-2 transition-transform duration-150 hover:scale-[1.02] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>SI Copilot · 4Hydrogen</span>
          <MessageSquare className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </button>
      )}

      {/* Slide-Over Copilot Telemetry Drawer */}
      {isCopilotOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          {/* Backdrop Scrim on Mobile */}
          <div
            onClick={() => setIsCopilotOpen(false)}
            className="fixed inset-0 bg-black/40 lg:bg-black/20 pointer-events-auto transition-opacity"
          />

          <aside
            aria-label="Gemini 4 Hydrogen SI Mission Copilot"
            className="relative z-10 w-full max-w-[460px] h-full bg-white dark:bg-[#070b18] border-l border-slate-300 dark:border-slate-800 shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Top Drawer Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-[#0a1024] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/40 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    AstroFlame SI Mission Copilot
                  </div>
                  <div className="text-[11px] font-mono text-sky-700 dark:text-sky-300 truncate">
                    Model: gemini-4-hydrogen · Free Tier SI
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset Copilot History"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCopilotOpen(false)}
                  aria-label="Close SI Copilot Drawer"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Chamber & Foundation Dataset Context Ribbon */}
            <div className="px-4 py-2 bg-slate-100/80 dark:bg-[#050814] border-b border-slate-200 dark:border-slate-800/90 text-[11px] font-mono tabular-nums space-y-1">
              <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-400">
                <span className="truncate">
                  Dataset:{' '}
                  <strong className="text-amber-700 dark:text-amber-300">
                    [{activeDataset.psiId}] {activeDataset.shortTitle}
                  </strong>
                </span>
                <span className="shrink-0 text-sky-700 dark:text-sky-300">
                  [{currentLens.badgeCode}]
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-slate-700 dark:text-slate-300">
                <span>
                  Gravity: <strong>{chamberParams.gravityG.toFixed(2)}g</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  O₂: <strong>{chamberParams.oxygenPercent.toFixed(0)}%</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Flow: <strong>{chamberParams.airflowCmPerSec.toFixed(1)} cm/s</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  E-Field:{' '}
                  <strong>
                    {chamberParams.eFieldKv >= 0 ? '+' : ''}
                    {chamberParams.eFieldKv.toFixed(1)} kV
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick Scientific Starters */}
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070b18]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Quick PSI Telemetry Queries
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-[#0d142b] hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Turn Message History */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1 px-1">
                    <span>
                      {msg.role === 'user'
                        ? 'Researcher'
                        : `SI Copilot (${msg.model || 'gemini-4-hydrogen'})`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`w-full rounded-xl p-3.5 text-xs leading-relaxed border ${
                      msg.role === 'user'
                        ? 'max-w-[88%] bg-sky-600 text-white border-sky-500 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-500/40'
                        : 'bg-slate-50 dark:bg-[#0b1124] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="markdown-body prose prose-xs dark:prose-invert max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>

                    {/* One-Click Telemetry Actions */}
                    {msg.telemetryActions && msg.telemetryActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                          <Sliders className="w-3 h-3" />
                          <span>One-Click Chamber &amp; Telemetry Actions</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.telemetryActions.map((act) => {
                            const isApplied = appliedActionId === act.id;
                            return (
                              <button
                                key={act.id}
                                type="button"
                                onClick={() => handleTriggerAction(act)}
                                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                  isApplied
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-white dark:bg-[#070b18] hover:bg-sky-50 dark:hover:bg-sky-950/40 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-mono font-semibold truncate">
                                    {act.label}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {act.description}
                                  </div>
                                </div>
                                {isApplied ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 shrink-0">
                                    Apply
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cited NASA PSI Datasets */}
                    {msg.citedDatasets && msg.citedDatasets.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <Database className="w-3 h-3" />
                          <span>Grounded NASA PSI Citations</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citedDatasets.map((ds) => (
                            <div
                              key={ds.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-[#060a17] border border-slate-300 dark:border-slate-800 text-[10px] font-mono"
                            >
                              <button
                                type="button"
                                onClick={() => setActiveDatasetId(ds.id)}
                                className="text-amber-700 dark:text-amber-300 hover:underline font-semibold cursor-pointer"
                                title="Load as Foundation PSI Dataset"
                              >
                                [{ds.psiId}]
                              </button>
                              <span className="text-slate-500">·</span>
                              <a
                                href={ds.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-600 dark:text-slate-400 hover:text-sky-400 inline-flex items-center gap-0.5"
                              >
                                <span>DOI</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="rounded-xl p-3.5 bg-slate-50 dark:bg-[#0b1124] border border-slate-200 dark:border-slate-800 text-xs font-mono text-sky-700 dark:text-sky-300 flex items-center justify-between">
                  <span>gemini-4-hydrogen synthesizing NASA PSI telemetry...</span>
                  <span className="text-[10px] text-slate-500">ThinkingLevel.HIGH</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Prompt Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendMessage();
              }}
              className="p-3 bg-slate-50 dark:bg-[#0a1024] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemini 4 Hydrogen about PSI datasets or chamber physics..."
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#050814] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white dark:bg-sky-400 dark:text-slate-950 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
