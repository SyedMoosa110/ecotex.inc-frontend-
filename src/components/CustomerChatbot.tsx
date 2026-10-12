'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  User, 
  Check, 
  Clock, 
  HelpCircle, 
  Package, 
  ShieldCheck, 
  ChevronDown,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { ChatMessage, CustomerThread } from '../types';
import { 
  getStoredThreads, 
  getActiveChatbotThreadId, 
  sendCustomerMessage, 
  subscribeToMessages,
  saveStoredThreads
} from '../services/messageService';

const SUGGESTED_QUICK_QUESTIONS = [
  '📦 Request fabric swatch kit',
  '💰 What are your wholesale MOQs & pricing tiers?',
  '🎨 How does custom logo flexo printing work?',
  '⏱️ What is your standard production lead time?'
];

export const CustomerChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPromptedBanner, setHasPromptedBanner] = useState(true);
  const [inputText, setInputText] = useState('');
  const [activeThread, setActiveThread] = useState<CustomerThread | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Optional customer identity capture
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [identitySaved, setIdentitySaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with active thread on mount & updates
  useEffect(() => {
    const syncCurrentThread = () => {
      const threads = getStoredThreads();
      const currentThreadId = getActiveChatbotThreadId();
      if (currentThreadId) {
        const found = threads.find(t => t.id === currentThreadId);
        if (found) {
          setActiveThread(found);
          if (found.customerName && found.customerName !== 'Website Visitor') {
            setCustName(found.customerName);
            setIdentitySaved(true);
          }
          if (found.email && !found.email.includes('visitor@livechat')) {
            setCustEmail(found.email);
          }
          if (found.company && found.company !== 'Live Storefront Visitor') {
            setCustCompany(found.company);
          }
        }
      }
    };

    syncCurrentThread();
    const unsubscribe = subscribeToMessages((threads) => {
      const currentThreadId = getActiveChatbotThreadId();
      if (currentThreadId) {
        const found = threads.find(t => t.id === currentThreadId);
        if (found) {
          setActiveThread(found);
          // If widget is closed and admin sent a new message, increase unread badge
          if (!isOpen) {
            const adminMsgs = found.messages.filter(m => m.sender === 'admin');
            setUnreadCount(adminMsgs.length);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [isOpen, activeThread?.messages]);

  const handleSendMessage = async (customMessageText?: string) => {
    const text = (customMessageText || inputText).trim();
    if (!text) return;

    setInputText('');

    // Check if this is the customer's very first message in this conversation
    const previousCustomerMessagesCount = activeThread 
      ? activeThread.messages.filter(m => m.sender === 'customer').length 
      : 0;
    const hasAlreadyReceivedGreeting = activeThread 
      ? activeThread.messages.some(m => m.sender === 'bot') 
      : false;

    // Send customer message into shared store (synced with Admin Messages)
    const { thread } = await sendCustomerMessage({
      text,
      customerName: custName || 'Website Visitor',
      email: custEmail || 'visitor@livechat.ecotexinc.com',
      company: custCompany || 'Live Storefront Visitor',
      subject: text.length > 35 ? text.slice(0, 35) + '...' : text
    });

    setActiveThread(thread);

    // ONLY send the automated thank-you acknowledgment on the VERY FIRST message!
    // After the first message, the bot does NOT reply — all further questions are answered by human Admin!
    if (previousCustomerMessagesCount === 0 && !hasAlreadyReceivedGreeting) {
      setTimeout(async () => {
        const now = new Date();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          senderName: 'EcoTex Support Desk',
          text: 'Thank you for reaching out to EcoTex! We have received your inquiry and notified our wholesale packaging desk in Corona, CA. Our specialist is reviewing your specs and will answer your questions right here shortly.',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedThread: CustomerThread = {
          ...thread,
          messages: [...thread.messages, botMsg]
        };

        const allThreads = getStoredThreads().map(t => t.id === thread.id ? updatedThread : t);
        saveStoredThreads(allThreads);
        setActiveThread(updatedThread);
      }, 500);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail) return;

    setIdentitySaved(true);
    setShowIdentityForm(false);

    if (activeThread) {
      const updatedThread: CustomerThread = {
        ...activeThread,
        customerName: custName,
        email: custEmail,
        company: custCompany || activeThread.company
      };
      const allThreads = getStoredThreads().map(t => t.id === activeThread.id ? updatedThread : t);
      saveStoredThreads(allThreads);
      setActiveThread(updatedThread);
    }
  };

  return (
    <>
      {/* ========================================================
          1. FLOATING LAUNCHER BUTTON & PROMPT PILL (BOTTOM-RIGHT)
         ======================================================== */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* Teaser greeting bubble */}
        {!isOpen && hasPromptedBanner && (
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl shadow-black/10 border border-[#B2E2C5]/50 max-w-[280px] text-xs font-serif text-[#1c1b18] flex items-start justify-between gap-3 animate-fadeIn">
            <div>
              <div className="flex items-center gap-1.5 font-sans font-bold text-[#166534] text-[11px] mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>EcoTex Live Chat</span>
              </div>
              <p className="text-[#444] font-light leading-relaxed">
                Need wholesale bag pricing or free fabric swatches? Chat with our team!
              </p>
            </div>
            <button
              onClick={() => setHasPromptedBanner(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasPromptedBanner(false);
          }}
          className="relative group p-4 rounded-full bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-xl shadow-[#166534]/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center border-2 border-white"
          title={isOpen ? 'Close Chat' : 'Chat with EcoTex Team'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              {/* Online pulsing indicator */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[10px] font-bold shadow-md">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ========================================================
          2. CHATBOT WINDOW DIALOG
         ======================================================== */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl shadow-black/25 border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#166534] to-[#14532d] text-white p-4 sm:p-5 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold shrink-0">
                <Package className="w-5 h-5 text-emerald-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#166534]" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-semibold tracking-wide text-white flex items-center gap-1.5">
                  <span>EcoTex Live Concierge</span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 font-light flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Corona, CA · Active Wholesale Desk</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#fcfbfa]/80">
            
            {/* Introductory Greeting */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 text-xs font-serif text-[#1c1b18] shadow-xs">
              <div className="flex items-center gap-1.5 font-sans font-bold text-[#166534] text-[11px] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Welcome to EcoTex Direct</span>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                Connect directly with our California facility for custom tote specifications, volume price tiers, or physical swatch kits.
              </p>
            </div>

            {/* Quick Action Chips (shown if thread has fewer than 2 messages) */}
            {(!activeThread || activeThread.messages.length <= 1) && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Questions:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_QUICK_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#166534] p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all shadow-xs cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {activeThread?.messages.map((m) => {
              const isCust = m.sender === 'customer';
              const isBot = m.sender === 'bot';
              const isAdmin = m.sender === 'admin';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isCust ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                    <span>{m.senderName}</span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs font-serif leading-relaxed shadow-xs ${
                      isCust
                        ? 'bg-[#166534] text-white rounded-tr-xs'
                        : isAdmin
                        ? 'bg-slate-900 text-white rounded-tl-xs border border-slate-800'
                        : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                    }`}
                  >
                    {m.text}
                  </div>

                  {isAdmin && (
                    <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified EcoTex Specialist</span>
                    </span>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Identity Form (Optional Banner to leave email for quotes) */}
          {showIdentityForm && (
            <form onSubmit={handleSaveIdentity} className="p-4 bg-emerald-50 border-t border-emerald-100 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#166534] text-xs">Your Contact Details:</span>
                <button
                  type="button"
                  onClick={() => setShowIdentityForm(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
              <input
                type="email"
                required
                placeholder="Business Email *"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
              <input
                type="text"
                placeholder="Company Name (optional)"
                value={custCompany}
                onChange={(e) => setCustCompany(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Save Details for Formal Quote
              </button>
            </form>
          )}

          {/* Footer Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0 space-y-2">
            {!identitySaved && !showIdentityForm && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Want a formal quotation emailed?</span>
                <button
                  onClick={() => setShowIdentityForm(true)}
                  className="text-[#166534] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Add Email</span>
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your question or request..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#166534] focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-40 disabled:hover:bg-[#166534] text-white transition-all shadow-md cursor-pointer shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};

export default CustomerChatbot;
