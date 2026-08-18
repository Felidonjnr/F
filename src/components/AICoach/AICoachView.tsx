import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Brain,
  ChevronRight,
  Flame,
  GraduationCap,
  Loader2,
  Send,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { StateManager } from '../../services/storage';

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

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Hello ${context.student.name}! I am your FirstClass OS Academic Accountability Coach. 

Current Vitals:
- **Academic Health:** ${context.academic_health}/100
- **Calculated Pressure:** ${context.pressure.score}/100 (${context.pressure.band})
- **Active Debts:** ${context.active_debt_count} items
- **Next Action:** ${context.pressure.next_mandatory_action}

How would you like to advance your semester goals right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Analyze my current pressure score & identify the #1 bottleneck',
    'Generate an emergency 3-day recovery plan for active debts',
    'Explain the intuition behind Stokes Theorem with boundary flux',
    'What should I prioritize in my study session today?',
  ];

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
        text: data.reply || 'Let us prioritize evidence-based active recall on your weak topics.',
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
          text: 'I recommend focusing on resolving your highest-severity academic debt items first through targeted 45-minute practice sessions.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-600">AI Intelligence Core</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
              Accountability Level: {context.student.accountability_level}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">AI Academic Coach & Socratic Mentor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time, context-grounded academic diagnosis, remediation strategies, and first-principles Socratic tutoring.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Real-time Context Drawer (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Brain className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Live System Vitals</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Target CGPA:</span>
                <span className="font-bold text-white">{context.student.target_cgpa}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Academic Health:</span>
                <span className="font-bold text-sky-400">{context.academic_health}/100</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Pressure State:</span>
                <span className="font-bold text-amber-400">{context.pressure.score} ({context.pressure.band})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Active Debts:</span>
                <span className="font-bold text-rose-400">{context.active_debt_count}</span>
              </div>
            </div>

            {context.weak_topics.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Identified Weak Topics:
                </div>
                <div className="space-y-1">
                  {context.weak_topics.slice(0, 3).map((w, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 flex justify-between">
                      <span className="truncate">{w.name}</span>
                      <span className="font-bold text-rose-400 ml-2">{w.mastery}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Fast Consult Prompts</span>
            <div className="space-y-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="w-full text-left p-2 rounded-xl text-xs text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition-all font-medium"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Chat Panel (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';

              return (
                <div key={m.id} className={`flex items-start space-x-3 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAi ? 'bg-slate-900 text-amber-400 shadow-xs' : 'bg-amber-500 text-slate-950 font-bold'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[85%] space-y-1 text-left ${isAi ? '' : 'items-end'}`}>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">{isAi ? 'AI Academic Coach' : 'You'}</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isAi
                          ? 'bg-slate-50 border border-slate-200 text-slate-900 font-normal shadow-2xs'
                          : 'bg-slate-900 text-white font-medium shadow-xs'
                      }`}
                    >
                      {m.text}
                    </div>

                    {m.suggestedAction && (
                      <div className="mt-1 flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl w-fit">
                        <Zap className="w-3.5 h-3.5" />
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
                  <span>Synthesizing academic diagnosis with syllabus context...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask your coach anything about exam readiness, concepts, or recovery..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
