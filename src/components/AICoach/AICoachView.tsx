import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Database,
  Flame,
  GraduationCap,
  Loader2,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  User,
  Zap,
} from 'lucide-react';
import { StateManager } from '../../services/storage';
import { RetrievalHealth } from '../../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

export const AICoachView: React.FC = () => {
  const stateManager = StateManager.getInstance();
  const context = stateManager.getAIContextPayload();
  const state = stateManager.getState();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrievalHealth, setRetrievalHealth] = useState<RetrievalHealth | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Hello ${context.student.name}! I am your FirstClass OS Academic Accountability Coach.\n\nCurrent Vitals:\n• **Academic Health:** ${context.academic_health}/100\n• **Pressure State:** ${context.pressure.score}/100 (${context.pressure.band})\n• **Active Deficits:** ${context.active_debt_count} items\n• **Next Mandatory Action:** ${context.pressure.next_mandatory_action}\n\nWhat concept, bottleneck, or recovery plan would you like to work through?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    fetch('/api/ai/retrieve/health')
      .then((res) => res.json())
      .then((data) => setRetrievalHealth(data))
      .catch((err) => console.warn('Failed to fetch retrieval health:', err));
  }, []);

  const activeDebts = state.debts.filter((d) => d.status !== 'resolved');
  const weakTopics = context.weak_topics;
  const pendingMissions = state.missions.filter((m) => m.status !== 'completed');

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/coach-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: textToSend,
          context: stateManager.getAIContextPayload(),
        }),
      });

      const data = await res.json();
      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Let us focus on evidence-based active recall to eliminate cognitive deficits.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: data.suggestedAction,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'I recommend resolving your highest-severity academic debt items first through targeted 45-minute practice sessions.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-coach-root" className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Socratic Mentor</span>
            <span className="text-xs font-bold px-2 py-0.2 bg-amber-100 text-amber-900 rounded-full">
              Accountability Level: {context.student.accountability_level}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">AI Academic Coach</h1>
          <p className="text-xs text-slate-500">
            Real-time, syllabus-grounded academic diagnosis, remediation strategies, and first-principles Socratic tutoring.
          </p>
          {retrievalHealth && (
            <div className="mt-2 inline-flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 bg-slate-100/80 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
              <Database className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Indexed: <strong className="text-slate-700 font-semibold">{retrievalHealth.keywordChunks}</strong> chunks | Embeddings:{' '}
                <strong className={retrievalHealth.hasEmbeddings ? 'text-emerald-600 font-semibold' : 'text-slate-600 font-semibold'}>
                  {retrievalHealth.hasEmbeddings ? 'on' : 'off'}
                </strong>{' '}
                | Gemini key:{' '}
                <strong className={retrievalHealth.geminiConfigured ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {retrievalHealth.geminiConfigured ? 'configured' : 'missing'}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 px-3 py-1.5 bg-slate-900 rounded-xl text-xs font-mono font-bold text-amber-300">
          <span>Health: {context.academic_health}/100</span>
          <span>•</span>
          <span>Pressure: {context.pressure.score}</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-[640px] overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';

            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isAi ? 'bg-slate-900 text-amber-400' : 'bg-amber-400 text-slate-950 font-black'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] space-y-1 text-left ${isAi ? '' : 'items-end'}`}>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700">{isAi ? 'Socratic Coach' : 'You'}</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isAi
                        ? 'bg-slate-50 border border-slate-200/80 text-slate-900 shadow-2xs'
                        : 'bg-slate-950 text-white font-medium shadow-xs'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.suggestedAction && (
                    <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl w-fit">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Action: {m.suggestedAction}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Synthesizing syllabus-grounded academic diagnosis...</span>
              </div>
            </div>
          )}
        </div>

        {/* CONTEXT CHIPS ABOVE THE INPUT */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
            Quick Context:
          </span>

          {activeDebts.length > 0 && (
            <button
              onClick={() =>
                handleSendMessage(
                  `Help me remediate my active debt: "${activeDebts[0].title}" in ${activeDebts[0].course_code}. What is the first-principles recovery step?`
                )
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shrink-0 transition-colors flex items-center space-x-1"
            >
              <AlertOctagon className="w-3 h-3 text-rose-600" />
              <span>Debt: {activeDebts[0].course_code}</span>
            </button>
          )}

          {weakTopics.length > 0 && (
            <button
              onClick={() =>
                handleSendMessage(
                  `Explain the physical intuition and primary governing equations of my weak topic: "${weakTopics[0].name}".`
                )
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 shrink-0 transition-colors flex items-center space-x-1"
            >
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>Weak Topic: {weakTopics[0].name}</span>
            </button>
          )}

          {pendingMissions.length > 0 && (
            <button
              onClick={() =>
                handleSendMessage(
                  `Give me a 3-step active recall strategy for today's mission: "${pendingMissions[0].topic_name}" (${pendingMissions[0].course_code}).`
                )
              }
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 shrink-0 transition-colors flex items-center space-x-1"
            >
              <Target className="w-3 h-3 text-sky-600" />
              <span>Mission: {pendingMissions[0].course_code}</span>
            </button>
          )}

          <button
            onClick={() =>
              handleSendMessage(
                `Analyze my calculated pressure score (${context.pressure.score}/100, ${context.pressure.band}) and explain what I should fix today.`
              )
            }
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 transition-colors flex items-center space-x-1"
          >
            <Flame className="w-3 h-3 text-slate-500" />
            <span>Pressure Breakdown</span>
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-white flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask your coach anything about exam readiness, concepts, or recovery..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="p-3 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
