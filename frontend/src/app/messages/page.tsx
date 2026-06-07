'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { messageAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { Send, Search, MessageCircle, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  senderId: string | Record<string, unknown>;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  _id: string;
  participants: Record<string, unknown>[];
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
  otherUser?: Record<string, unknown>;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const { user, accessToken } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    fetchConversations();
    // Connect socket
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvIdRef.current
            ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt } }
            : c
        )
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  useEffect(() => {
    if (targetUserId) openConversationWithUser(targetUserId);
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const res = await messageAPI.getConversations();
      const convs = res.data.data || [];
      setConversations(convs);
      if (convs.length > 0 && !targetUserId) openConversation(convs[0]._id);
    } catch {}
    setIsLoadingConvs(false);
  };

  const openConversation = async (convId: string) => {
    setActiveConvId(convId);
    setIsLoadingMsgs(true);
    socketRef.current?.emit('join_conversation', convId);
    try {
      const res = await messageAPI.getMessages(convId);
      setMessages(res.data.data || []);
    } catch {}
    setIsLoadingMsgs(false);
    // Mark as read
    setConversations((prev) => prev.map((c) => c._id === convId ? { ...c, unreadCount: 0 } : c));
  };

  const openConversationWithUser = async (userId: string) => {
    try {
      const res = await messageAPI.getOrCreateConversation(userId);
      const conv = res.data.data;
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conv._id);
        if (!exists) return [conv, ...prev];
        return prev;
      });
      openConversation(conv._id);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      if (msg) toast.error(msg);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvId || isSending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    try {
      const res = await messageAPI.sendMessage(activeConvId, { content });
      const msg = res.data.data;
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => c._id === activeConvId ? { ...c, lastMessage: { content, createdAt: msg.createdAt } } : c)
      );
    } catch (e: unknown) {
      const errMsg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send message';
      toast.error(errMsg);
      setNewMessage(content); // restore message on failure
    }
    setIsSending(false);
  };

  const getOtherParticipant = (conv: Conversation) => {
    if (conv.otherUser) return conv.otherUser;
    return conv.participants?.find((p) => (p._id as string) !== user?.id) || conv.participants?.[0];
  };

  const getSenderName = (msg: Message) => {
    const senderId = typeof msg.senderId === 'object' ? (msg.senderId as Record<string, unknown>)._id : msg.senderId;
    return senderId === user?.id ? 'You' : null;
  };

  const isOwn = (msg: Message) => {
    const senderId = typeof msg.senderId === 'object'
      ? (msg.senderId as Record<string, unknown>)._id as string
      : msg.senderId;
    return senderId === user?.id || senderId === (user as any)?._id;
  };

  const getProfileLink = (other: Record<string, unknown> | null) => {
    if (!other) return null;
    const id = other._id as string;
    const role = other.role as string;
    if (role === 'athlete') return `/athlete/${id}`;
    if (role === 'coach' || role === 'professional') return `/coach/${id}`;
    if (role === 'organization') return `/org/${id}`;
    return null;
  };

  const filteredConvs = conversations.filter((c) => {
    const other = getOtherParticipant(c);
    const name = ((other?.fullName || other?.name || '') as string).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const activeOther = activeConv ? getOtherParticipant(activeConv) : null;

  // On mobile: show chat panel when a conversation is active, otherwise show list
  const showChatOnMobile = !!activeConvId;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div
          className="flex-1 flex max-w-7xl mx-auto w-full px-0 sm:px-6 lg:px-8 py-0 sm:py-4 gap-0 sm:gap-4 overflow-hidden"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          {/* Sidebar — hidden on mobile when chat is open */}
          <div className={`${showChatOnMobile ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 flex-shrink-0 bg-white sm:rounded-xl border border-gray-200 flex-col overflow-hidden`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoadingConvs ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center p-8">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Connect with athletes, coaches & orgs to start chatting</p>
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const name = (other?.fullName || other?.name || 'Unknown') as string;
                  const isActive = conv._id === activeConvId;
                  return (
                    <div
                      key={conv._id}
                      className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left cursor-pointer ${isActive ? 'bg-blue-50 border-r-2 border-brand' : ''}`}
                      onClick={() => openConversation(conv._id)}
                    >
                      {(() => {
                        const profileLink = getProfileLink(other);
                        return (
                          <div
                            className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
                            onClick={(e) => { if (profileLink) { e.stopPropagation(); } }}
                          >
                            {profileLink ? (
                              <Link href={profileLink} onClick={(e) => e.stopPropagation()}>
                                {other?.photo ? (
                                  <img src={other.photo as string} alt={name} loading="lazy" className="w-full h-full object-cover" />
                                ) : getInitials(name)}
                              </Link>
                            ) : (
                              other?.photo ? (
                                <img src={other.photo as string} alt={name} loading="lazy" className="w-full h-full object-cover" />
                              ) : getInitials(name)
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-sm text-gray-900 truncate">{name}</span>
                          {conv.lastMessage && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                              {formatRelativeTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                          {conv.unreadCount > 0 && (
                            <span className="ml-1 flex-shrink-0 w-5 h-5 bg-brand text-white text-xs rounded-full flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat panel — full screen on mobile when active */}
          <div className={`${showChatOnMobile ? 'flex' : 'hidden sm:flex'} flex-1 flex-col bg-white sm:rounded-xl border border-gray-200 overflow-hidden`}>
            {!activeConvId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Your messages</h3>
                <p className="text-sm text-gray-500 mt-1">Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat header — back button on mobile */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <button
                    onClick={() => setActiveConvId(null)}
                    aria-label="Back to conversations"
                    className="sm:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {(() => {
                    const profileLink = getProfileLink(activeOther);
                    const displayName = (activeOther?.fullName || activeOther?.name || 'Unknown') as string;
                    const avatar = (
                      <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                        {activeOther?.photo ? (
                          <img src={activeOther.photo as string} alt={displayName} loading="lazy" className="w-full h-full object-cover" />
                        ) : getInitials(displayName)}
                      </div>
                    );
                    const nameBlock = (
                      <div>
                        <p className="font-semibold text-gray-900 hover:text-brand transition-colors">{displayName}</p>
                        <p className="text-xs text-gray-500 capitalize">{activeOther?.role as string}</p>
                      </div>
                    );
                    return profileLink ? (
                      <Link href={profileLink} className="flex items-center gap-3">
                        {avatar}{nameBlock}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">{avatar}{nameBlock}</div>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isLoadingMsgs ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const own = isOwn(msg);
                      return (
                        <div key={msg._id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${own ? 'bg-brand text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${own ? 'text-blue-200' : 'text-gray-400'}`}>
                              {formatRelativeTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t border-gray-100">
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="p-2.5 bg-brand text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}

