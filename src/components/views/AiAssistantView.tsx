/**
 * BritConnect AI Analytics Assistant
 * Section 8.1 & 8.2: Natural-Language Analytics Chatbot with deterministic data grounding
 * Powered by Gemini 3.8 Flash server-side. Never invents figures.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RotateCcw,
  Download,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { CleanedCustomerRecord } from '../../types/telecom';
import { saveChatMessage, getChatHistory, clearChatHistory } from '../../services/db';

interface AiAssistantViewProps {
  customers: CleanedCustomerRecord[];
  allActiveCustomers: CleanedCustomerRecord[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  customers,
  allActiveCustomers,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load chat history from IndexedDB on mount
  useEffect(() => {
    getChatHistory().then((history) => {
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Initial greeting
        const welcome: ChatMessage = {
          id: 'msg-welcome',
          role: 'assistant',
          content: `Welcome to BritConnect Retention Intelligence. I am your grounded AI analytics assistant. All of my answers are strictly computed from your actual subscriber records.

You can ask me questions such as:
• "Which customers are most likely to churn in the next 30 days?"
• "How much revenue is exposed to contracts expiring within 60 days?"
• "Why is churn higher in Small Business compared to Consumer?"
• "Compare churn rates between 24-month and Rolling 30-day contracts"
• "What retention plan do you recommend for account BC-000010?"`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcome]);
      }
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Starter Prompts
  const starterPrompts = [
    'Which customers are most likely to churn in the next 30 days?',
    'How much revenue is at risk from contracts expiring in 60 days?',
    'Compare churn between fixed-term and rolling contracts',
    'Why is churn higher in Small Business?',
    'What are the top 3 drivers of customer churn?',
  ];

  // Send Message
  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    await saveChatMessage(userMsg);

    // Compute deterministic summary to ground Gemini
    const totalCount = customers.length;
    const activeCount = allActiveCustomers.length;
    const churnedCount = customers.filter((c) => c.churnFlag === 1).length;
    const activeMrr = allActiveCustomers.reduce((s, c) => s + c.effectiveMonthlyCharge, 0);
    const revAtRisk = allActiveCustomers.reduce((s, c) => s + (c.expectedMonthlyRevenueAtRisk || 0), 0);
    const expiring30 = allActiveCustomers.filter((c) => c.contractExpiring30Days === 1).length;
    const expiring60 = allActiveCustomers.filter((c) => c.contractExpiring60Days === 1).length;
    const criticalCount = allActiveCustomers.filter((c) => (c.churnProbability || 0) >= 0.7).length;

    // Top high risk accounts sample
    const topRiskSample = allActiveCustomers
      .sort((a, b) => (b.churnProbability || 0) - (a.churnProbability || 0))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        prob: `${((c.churnProbability || 0) * 100).toFixed(1)}%`,
        tier: c.riskTier,
        monthlyCharge: `£${c.effectiveMonthlyCharge}`,
        monthsToEnd: c.monthsToContractEnd,
        complaints: c.complaints12M,
        plan: c.planName,
        topDriver: c.topDrivers?.[0]?.plainEnglish,
      }));

    const datasetSummary = {
      totalCustomers: totalCount,
      activeSubscribers: activeCount,
      churnedSubscribers: churnedCount,
      churnRate: totalCount > 0 ? +((churnedCount / totalCount) * 100).toFixed(1) : 0,
      activeMRR: Math.round(activeMrr),
      monthlyRevenueAtRisk: Math.round(revAtRisk),
      contractsExpiring30Days: expiring30,
      contractsExpiring60Days: expiring60,
      criticalRiskSubscribers: criticalCount,
      sampleHighRiskAccounts: topRiskSample,
    };

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          datasetSummary,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response generated from the model.',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      await saveChatMessage(botMsg);
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: 'Unable to process query. Please check your network connection and server API key status.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    await clearChatHistory();
    const welcome: ChatMessage = {
      id: 'msg-welcome-new',
      role: 'assistant',
      content: 'Chat session reset. How can I assist with BritConnect subscriber analytics today?',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E3E7EE]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#0B1F3A]">
              BritConnect Grounded AI Analytics Assistant
            </h1>
            <p className="text-xs text-[#5B6575]">
              Deterministic data queries powered by Gemini 3.8 Flash. Zero fabricated numbers.
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-xs text-[#5B6575] hover:text-[#0B1F3A] border border-[#E3E7EE] rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Chat Session</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white rounded-xl border border-[#E3E7EE] shadow-2xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-[#1D4C8F] text-white' : 'bg-[#0B1F3A] text-[#C9A227]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed relative group ${
                  isUser
                    ? 'bg-[#0B1F3A] text-white rounded-tr-none'
                    : 'bg-[#F5F6F8] text-[#1A2233] border border-[#E3E7EE] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {!isUser && (
                  <button
                    onClick={() => handleCopy(m.id, m.content)}
                    className="absolute top-2 right-2 p-1 text-[#8F9CAE] hover:text-[#0B1F3A] opacity-0 group-hover:opacity-100 transition"
                    title="Copy response"
                  >
                    {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-2xl p-4 text-xs text-[#5B6575] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A227] animate-pulse" />
              <span>Querying verified subscriber database and drafting insight...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Starter Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <span className="text-[10px] text-[#5B6575] shrink-0 font-medium">Quick Queries:</span>
        {starterPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 bg-white border border-[#E3E7EE] hover:border-[#C9A227] hover:bg-[#F4F7FB] text-[#0B1F3A] text-[11px] font-medium rounded-lg whitespace-nowrap transition shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E3E7EE] shadow-xs"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about churn risk, contract horizons, or customer scores..."
          className="flex-1 px-3 py-2 text-xs text-[#1A2233] placeholder-[#8F9CAE] focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-[#0B1F3A] hover:bg-[#12305A] text-[#C9A227] rounded-lg transition disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
