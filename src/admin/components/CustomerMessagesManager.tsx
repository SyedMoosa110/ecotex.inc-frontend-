'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  User, 
  Building, 
  Plus, 
  X, 
  ExternalLink,
  MessageCircle,
  Filter,
  Check,
  Calendar,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ChatMessage, CustomerThread } from '../../types';
import { 
  getStoredThreads, 
  saveStoredThreads, 
  subscribeToMessages, 
  sendAdminReply,
  INITIAL_THREADS 
} from '../../services/messageService';

const QUICK_REPLIES = [
  {
    label: '👋 Greet & Acknowledge',
    text: 'Thank you for reaching out to EcoTex! We have received your inquiry. One of our dedicated wholesale packaging specialists is reviewing your specs and will share a detailed breakdown shortly.'
  },
  {
    label: '📦 Swatches Dispatched',
    text: 'Great news! Your fabric swatch kit and physical sample box have been prepared and dispatched. Tracking info will be sent to your email.'
  },
  {
    label: '💼 Wholesale Pricing Ready',
    text: 'We have generated custom wholesale tier pricing based on your volume requirements. Would you like us to schedule a brief 10-minute call to review specs?'
  },
  {
    label: '🎨 Request Artwork Files',
    text: 'To generate your complimentary 3D digital mockup proof, please email your high-resolution vector logo (.AI or .PDF) to graphics@ecotexinc.com.'
  },
  {
    label: '⏱️ Production Lead Time',
    text: 'Standard production lead time is 12-14 business days post artwork approval. Expedited rush production (7 days) is also available upon request.'
  }
];

export const CustomerMessagesManager: React.FC = () => {
  const { quotes } = useStore();

  const [threads, setThreads] = useState<CustomerThread[]>(() => getStoredThreads());

  // Real-time synchronization with Frontend Chatbot
  useEffect(() => {
    const unsubscribe = subscribeToMessages((updatedThreads) => {
      setThreads(updatedThreads);
    });
    return () => unsubscribe();
  }, []);

  // Sync any newly submitted website contact forms / quotes from useStore
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;

    setThreads((current) => {
      let updated = [...current];
      let hasChanges = false;

      quotes.forEach((q) => {
        // If message is present or it's a direct web inquiry, ensure it's in threads
        const existing = updated.find((t) => t.id === `quote-${q.id}` || t.email.toLowerCase() === q.email.toLowerCase());
        if (!existing && (q.message || q.bagType)) {
          const newThread: CustomerThread = {
            id: `quote-${q.id}`,
            customerName: q.name || 'Valued Customer',
            company: q.company || 'Direct Client',
            email: q.email,
            phone: q.phone || '+1 (800) 555-0199',
            subject: q.bagType ? `${q.bagType} Inquiry (${q.quantity ? q.quantity + ' units' : 'Bulk'})` : 'Website Customer Inquiry',
            status: q.status === 'Closed' ? 'Resolved' : 'New',
            isUnread: true,
            channel: q.bagType === 'Direct Web Inquiry' ? 'Contact Form' : 'RFQ Quote',
            lastUpdated: q.date || 'Just now',
            messages: [
              {
                id: `qm-${q.id}`,
                sender: 'customer',
                senderName: q.name || 'Customer',
                text: q.message || `Customer submitted inquiry for ${q.bagType || 'Wholesale Packaging'} (Quantity: ${q.quantity || '5,000'}). Please follow up.`,
                timestamp: q.date || 'Just now',
                channel: 'web'
              }
            ]
          };
          updated = [newThread, ...updated];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        saveStoredThreads(updated);
      }
      return hasChanges ? updated : current;
    });
  }, [quotes]);

  // Persist threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ecotex_customer_messages_v1', JSON.stringify(threads));
    } catch (e) {
      console.warn('Failed to save customer messages:', e);
    }
  }, [threads]);

  const [selectedThreadId, setSelectedThreadId] = useState<string>(threads[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Unread' | 'New' | 'In Discussion' | 'Resolved'>('All');
  const [replyText, setReplyText] = useState('');
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Thread Form State
  const [newThreadData, setNewThreadData] = useState({
    customerName: '',
    company: '',
    email: '',
    phone: '',
    subject: '',
    initialMessage: '',
    channel: 'Direct Web Inquiry' as CustomerThread['channel']
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  // Mark thread as read when selected
  const handleSelectThread = (id: string) => {
    setSelectedThreadId(id);
    const updated = threads.map((t) => (t.id === id ? { ...t, isUnread: false } : t));
    setThreads(updated);
    saveStoredThreads(updated);
  };

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.customerName.toLowerCase().includes(q) ||
        (t.company && t.company.toLowerCase().includes(q)) ||
        t.email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.messages.some((m) => m.text.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterStatus === 'All') return true;
      if (filterStatus === 'Unread') return t.isUnread;
      return t.status === filterStatus;
    });
  }, [threads, searchQuery, filterStatus]);

  // Send Reply (Synchronizes with Frontend Chatbot live)
  const handleSendReply = async (customText?: string) => {
    const textToSend = (customText || replyText).trim();
    if (!textToSend || !activeThread) return;

    setReplyText('');
    const updatedThread = await sendAdminReply(activeThread.id, textToSend);
    if (updatedThread) {
      setThreads(getStoredThreads());
      showToast(`Reply sent to ${activeThread.customerName}!`);
    }
  };

  // Change Thread Status
  const handleUpdateStatus = (newStatus: CustomerThread['status']) => {
    if (!activeThread) return;
    const updated = threads.map((t) => (t.id === activeThread.id ? { ...t, status: newStatus } : t));
    setThreads(updated);
    saveStoredThreads(updated);
    showToast(`Conversation status updated to "${newStatus}"`);
  };

  // Submit New Inbound Conversation
  const handleCreateNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadData.customerName.trim() || !newThreadData.email.trim()) return;

    const created: CustomerThread = {
      id: `thread-${Date.now()}`,
      customerName: newThreadData.customerName.trim(),
      company: newThreadData.company.trim() || 'Wholesale Client',
      email: newThreadData.email.trim(),
      phone: newThreadData.phone.trim() || '+1 (555) 000-0000',
      subject: newThreadData.subject.trim() || 'General Customer Inquiry',
      status: 'New',
      isUnread: false,
      channel: newThreadData.channel,
      lastUpdated: 'Just now',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'customer',
          senderName: newThreadData.customerName.trim(),
          text: newThreadData.initialMessage.trim() || 'New inquiry registered by admin staff.',
          timestamp: 'Just now',
          channel: 'web'
        }
      ]
    };

    const updated = [created, ...threads];
    setThreads(updated);
    saveStoredThreads(updated);
    setSelectedThreadId(created.id);
    setShowNewThreadModal(false);
    setNewThreadData({
      customerName: '',
      company: '',
      email: '',
      phone: '',
      subject: '',
      initialMessage: '',
      channel: 'Direct Web Inquiry'
    });
    showToast(`New customer conversation created for ${created.customerName}`);
  };

  // Helper for quick WhatsApp connect
  const getWhatsAppLink = (phone?: string, name?: string) => {
    if (!phone) return '#';
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const greeting = encodeURIComponent(`Hello ${name || 'there'}! This is the EcoTex Wholesale Packaging team following up on your inquiry.`);
    return `https://wa.me/${cleanNumber}?text=${greeting}`;
  };

  // Unread badge count
  const unreadCount = threads.filter((t) => t.isUnread).length;
  const inDiscussionCount = threads.filter((t) => t.status === 'In Discussion').length;

  return (
    <div className="space-y-6 animate-fadeInUp pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#B2E2C5]/30 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#4E9F76]/15 text-[#4E9F76]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
                Customer Messages & Live Connect
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                  {unreadCount} Unread
                </span>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Stay in direct contact with wholesale clients and buyers. Reply to website inquiries, chat via WhatsApp, dispatch sample updates, and log communications.
          </p>
        </div>

        {/* Quick Connection Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowNewThreadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4E9F76] hover:bg-[#3d8560] text-white font-bold text-xs shadow-md shadow-[#4E9F76]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer Thread</span>
          </button>
        </div>
      </div>

      {/* Fast Connect Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Conversations</div>
            <div className="text-xl font-black text-[#0f172a] mt-0.5">{threads.length}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Response</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {threads.filter((t) => t.status === 'New').length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Active Discussion</div>
            <div className="text-xl font-black text-[#4E9F76] mt-0.5">{inDiscussionCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#4E9F76]/15 text-[#4E9F76] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">&lt; 15 Mins</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Two-Pane Messaging Interface */}
      <div className="bg-white rounded-3xl border border-[#B2E2C5]/30 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* ========================================================
            LEFT PANE: THREADS LIST (COL 1-4)
           ======================================================== */}
        <div className="lg:col-span-4 border-r border-slate-100 flex flex-col bg-[#fcfdfc]">
          
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, company, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76] focus:ring-1 focus:ring-[#4E9F76] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {(['All', 'Unread', 'New', 'In Discussion', 'Resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === status
                      ? 'bg-[#4E9F76] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status}
                  {status === 'Unread' && unreadCount > 0 && ` (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No conversations found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or search query</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`p-4 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-50/60 border-l-4 border-[#4E9F76]'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-[#4E9F76] font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {thread.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#0f172a] truncate">
                              {thread.customerName}
                            </span>
                            {thread.isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#4E9F76] shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-medium">
                            {thread.company || thread.email}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {thread.lastUpdated}
                      </span>
                    </div>

                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">
                        {thread.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 line-clamp-1">
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </p>
                    </div>

                    {/* Status & Channel Tags */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        thread.status === 'New'
                          ? 'bg-amber-100 text-amber-800'
                          : thread.status === 'In Discussion'
                          ? 'bg-blue-100 text-blue-800'
                          : thread.status === 'Quoted'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-[#B2E2C5]/30 text-[#4E9F76]'
                      }`}>
                        {thread.status}
                      </span>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {thread.channel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ========================================================
            RIGHT PANE: ACTIVE CONVERSATION & REPLY (COL 5-12)
           ======================================================== */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Active Thread Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#fbfdfb]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#4E9F76] text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {activeThread.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-sm sm:text-base text-[#0f172a]">
                        {activeThread.customerName}
                      </h2>
                      {activeThread.company && (
                        <span className="text-xs text-slate-500 font-medium">
                          · {activeThread.company}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <a 
                        href={`mailto:${activeThread.email}`}
                        className="hover:text-[#4E9F76] flex items-center gap-1 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activeThread.email}</span>
                      </a>
                      {activeThread.phone && (
                        <a 
                          href={`tel:${activeThread.phone}`}
                          className="hover:text-[#4E9F76] flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activeThread.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instant Connect & Status Action Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* WhatsApp Direct Connect */}
                  {activeThread.phone && (
                    <a
                      href={getWhatsAppLink(activeThread.phone, activeThread.customerName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Direct Chat on WhatsApp"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </a>
                  )}

                  {/* Mailto Direct */}
                  <a
                    href={`mailto:${activeThread.email}?subject=${encodeURIComponent('EcoTex Wholesale Packaging - ' + activeThread.subject)}`}
                    title="Send Email"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email</span>
                  </a>

                  {/* Status Dropdown */}
                  <select
                    value={activeThread.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as CustomerThread['status'])}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#4E9F76] cursor-pointer"
                  >
                    <option value="New">🟡 New</option>
                    <option value="In Discussion">🔵 In Discussion</option>
                    <option value="Quoted">🟣 Quoted</option>
                    <option value="Resolved">🟢 Resolved</option>
                  </select>

                </div>
              </div>

              {/* Inquiry Subject Strip */}
              <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-bold text-slate-800">Subject:</span>
                  <span className="font-medium truncate max-w-md">{activeThread.subject}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                  <span>Channel:</span>
                  <span className="font-semibold text-slate-600">{activeThread.channel}</span>
                </div>
              </div>

              {/* Messages History Timeline */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[460px] bg-slate-50/40">
                {activeThread.messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 font-medium">
                        <span className="font-bold text-slate-700">{msg.senderName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isAdmin
                            ? 'bg-[#166534] text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Templates Chip Strip */}
              <div className="px-4 py-2 border-t border-slate-100 bg-[#fbfdfb]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#4E9F76]" />
                  <span>1-Click Quick Response Templates:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_REPLIES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(tmpl.text)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#4E9F76] hover:bg-[#B2E2C5]/10 text-slate-700 hover:text-[#4E9F76] text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Composer */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder={`Write a reply to ${activeThread.customerName}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="w-full p-3.5 pr-28 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#4E9F76] focus:ring-1 focus:ring-[#4E9F76] resize-none transition-all placeholder:text-slate-400"
                  />
                  
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <button
                      onClick={() => handleSendReply()}
                      disabled={!replyText.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4E9F76] hover:bg-[#3d8560] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>Press <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600">Ctrl + Enter</kbd> to quickly send reply</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Customer receives notification via registered email
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
              <h3 className="font-bold text-base text-slate-700">No Conversation Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a customer thread from the left pane to view message history and send replies.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================
          MODAL: CREATE NEW INBOUND THREAD - Centered with Blurry Backdrop
         ======================================================== */}
      {showNewThreadModal && (
        <div 
          onClick={() => setShowNewThreadModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn transition-all"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/40 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setShowNewThreadModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#4E9F76]/15 text-[#4E9F76] flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0f172a]">New Customer Thread</h3>
                <p className="text-xs text-slate-500">Log an inbound inquiry from a client or phone call</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewThread} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={newThreadData.customerName}
                    onChange={(e) => setNewThreadData({ ...newThreadData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Pacific Goods Co."
                    value={newThreadData.company}
                    onChange={(e) => setNewThreadData({ ...newThreadData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={newThreadData.email}
                    onChange={(e) => setNewThreadData({ ...newThreadData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={newThreadData.phone}
                    onChange={(e) => setNewThreadData({ ...newThreadData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Product Inquired</label>
                <input
                  type="text"
                  placeholder="e.g. Custom Canvas Tote Quote (5,000 units)"
                  value={newThreadData.subject}
                  onChange={(e) => setNewThreadData({ ...newThreadData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Customer Message</label>
                <textarea
                  rows={3}
                  placeholder="Notes from customer inquiry or phone discussion..."
                  value={newThreadData.initialMessage}
                  onChange={(e) => setNewThreadData({ ...newThreadData, initialMessage: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4E9F76] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4E9F76] hover:bg-[#3d8560] text-white font-bold text-xs shadow-md shadow-[#4E9F76]/20 transition-all cursor-pointer"
                >
                  Create Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerMessagesManager;
