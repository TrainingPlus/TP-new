import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [users, setUsers] = useState([]);
  const scrollRef = useRef(null);

  const loadUsers = async () => {
    try {
      const list = await base44.entities.User.list(200);
      setUsers(list.filter(u => u.approved !== false && u.role !== 'employee' || (u.role === 'employee' && u.approved)));
    } catch (e) {
      setUsers([]);
    }
  };

  const loadMessages = async () => {
    try {
      const list = await base44.entities.ChatMessage.list('-created_date', 100);
      setMessages([...list].reverse());
    } catch (e) {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadMessages();
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => [...prev, event.data].slice(-100));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setText('');
    try {
      await base44.entities.ChatMessage.create({
        text: trimmed,
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: user.role
      });
    } catch (e) {
      setText(trimmed);
    }
  };

  const onlineUsers = users;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-12 right-4 sm:right-6 w-14 h-14 bg-primary hover:opacity-90 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 z-40"
        aria-label="Toggle chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-28 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] sm:h-[560px] bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border z-40 animate-slide-up">
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg leading-tight">Institute Chat</h3>
              <p className="text-xs opacity-80">{onlineUsers.length} members connected</p>
            </div>
          </div>

          <div className="px-3 py-2 bg-secondary/50 border-b border-border flex gap-1.5 overflow-x-auto scrollbar-thin">
            {onlineUsers.slice(0, 12).map(u => (
              <div key={u.id} className="flex items-center gap-1 shrink-0 text-xs bg-card px-2 py-1 rounded-full border border-border">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="max-w-[80px] truncate">{u.full_name || u.email}</span>
              </div>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-background">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Say hello!</p>
            )}
            {messages.map(m => {
              const isSelf = m.sender_id === user?.id;
              return (
                <div key={m.id} className={cn('flex flex-col', isSelf ? 'items-end' : 'items-start')}>
                  <div className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2 shadow-sm',
                    isSelf ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none'
                  )}>
                    {!isSelf && <p className="text-xs font-semibold text-primary mb-0.5">{m.sender_name}</p>}
                    <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(m.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-card border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Type a message..."
              className="flex-1 text-sm bg-muted px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={send}
              className="bg-primary hover:opacity-90 text-white p-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
