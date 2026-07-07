"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Send, User, Bot, Sparkles, Check, CheckCheck, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

interface ChatModuleProps {
  user: any;
}

export default function ChatModule({ user }: ChatModuleProps) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load collaborators list from Supabase
  useEffect(() => {
    async function loadContacts() {
      try {
        setLoadingContacts(true);
        // Load all users to chat with (excluding current admin to avoid self-chatting)
        const { data, error } = await supabase
          .from("usuarios")
          .select("*")
          .neq("id", user.id)
          .order("nome", { ascending: true });

        if (!error && data) {
          // Fetch unread count for each contact
          const contactsWithUnread = await Promise.all(
            data.map(async (contact) => {
              const { count } = await supabase
                .from("chat_mensagens")
                .select("*", { count: "exact", head: true })
                .eq("sender_id", contact.id)
                .eq("receiver_id", user.id)
                .eq("lida", false);
              return { ...contact, unreadCount: count || 0 };
            })
          );
          setContacts(contactsWithUnread);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContacts(false);
      }
    }

    loadContacts();
  }, [user.id]);

  // Load chat messages when selected contact changes
  useEffect(() => {
    if (!selectedContact) return;

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const { data, error } = await supabase
          .from("chat_mensagens")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (!error && data) {
          setChatMessages(data);

          // Mark incoming messages as read
          const unreadIds = data
            .filter((m: any) => m.receiver_id === user.id && !m.lida)
            .map((m: any) => m.id);
          
          if (unreadIds.length > 0) {
            await supabase
              .from("chat_mensagens")
              .update({ lida: true })
              .in("id", unreadIds);

            // Update unread count local state
            setContacts(prev =>
              prev.map(c => c.id === selectedContact.id ? { ...c, unreadCount: 0 } : c)
            );
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages();
  }, [selectedContact, user.id]);

  // Realtime subscription for incoming/outgoing messages
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_mensagens" },
        (payload) => {
          const newMsg = payload.new as any;
          
          // If message is between current admin and active selected contact
          if (selectedContact && (
            (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === user.id) ||
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedContact.id)
          )) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (newMsg.receiver_id === user.id) {
              supabase.from("chat_mensagens").update({ lida: true }).eq("id", newMsg.id).then();
            }
          } else if (newMsg.receiver_id === user.id) {
            // Increment unread count for other contact
            setContacts(prev =>
              prev.map(c => c.id === newMsg.sender_id ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c)
            );
            toast.info(`Nova mensagem de ${newMsg.sender_id}!`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_mensagens" },
        (payload) => {
          const updatedMsg = payload.new as any;
          setChatMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact, user.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContact) return;

    setSendingMessage(true);
    const textToSend = inputText.trim();
    setInputText("");

    try {
      const { data, error } = await supabase
        .from("chat_mensagens")
        .insert([{
          sender_id: user.id,
          receiver_id: selectedContact.id,
          conteudo: textToSend
        }])
        .select()
        .single();

      if (!error && data) {
        setChatMessages(prev => [...prev, data]);
      } else {
        toast.error("Erro ao registrar mensagem no banco.");
      }
    } catch (err) {
      toast.error("Erro de conexão ao enviar.");
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cargo && c.cargo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-140px)] w-full bg-zinc-950/20 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
      {/* LEFT COLUMN: COLLABORATORS LIST */}
      <div className="w-[350px] border-r border-white/5 flex flex-col bg-zinc-950/40">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-base font-black text-white mb-3">Colaboradores</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-500" size={16} />
            <input 
              type="text"
              placeholder="Buscar colaborador..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-zinc-900/50 border border-white/5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loadingContacts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-orange-500" size={24} />
            </div>
          ) : filteredContacts.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-10">Nenhum colaborador encontrado.</p>
          ) : (
            filteredContacts.map(c => {
              const active = selectedContact?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${active ? "bg-orange-600/10 border border-orange-500/20 text-white" : "hover:bg-zinc-900/40 text-zinc-400 border border-transparent"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs uppercase text-orange-500">
                      {c.nome.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight">{c.nome.split(" ")[0]} {c.nome.split(" ")[1] || ""}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-semibold">{c.cargo || "Operacional"}</p>
                    </div>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-orange-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-lg shadow-orange-600/20">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE CONVERSATION */}
      <div className="flex-1 flex flex-col bg-zinc-950/20 relative">
        {selectedContact ? (
          <>
            {/* Contact Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center font-black text-sm uppercase text-orange-500">
                  {selectedContact.nome.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">{selectedContact.nome}</h3>
                  <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider font-semibold">
                    {selectedContact.cargo || "Colaborador"} • {selectedContact.unidade_alocacao || "Não alocado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-white/5">
                <Phone size={12} className="text-orange-500" />
                <span>{selectedContact.telefone}</span>
              </div>
            </div>

            {/* Messages Body */}
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
              style={{
                backgroundColor: "#0b141a",
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0), radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px"
              }}
            >
              {loadingMessages ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-orange-500" size={24} />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-10">
                  <Bot size={36} className="opacity-20 mb-3" />
                  <p className="text-xs">Nenhuma mensagem registrada.</p>
                  <p className="text-[10px] opacity-75 mt-1">Inicie a conversa digitando no campo abaixo.</p>
                </div>
              ) : (
                chatMessages.map(m => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} animate-fade-in`}>
                      <div 
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${mine ? "rounded-tr-none" : "rounded-tl-none border border-white/5"}`}
                        style={{
                          backgroundColor: mine ? "#005c4b" : "#202c33",
                          color: "#e9edef"
                        }}
                      >
                        <p className="whitespace-pre-line">{m.conteudo}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[9px] opacity-60">
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {mine && (
                            m.lida ? <CheckCheck size={11} className="text-blue-300" /> : <Check size={11} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/5 bg-zinc-950/40">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 bg-zinc-900/50 border border-white/5 text-white text-sm rounded-2xl px-4 py-3 placeholder-zinc-500 resize-none focus:outline-none focus:border-orange-500 focus:bg-orange-600/5 transition-all h-[50px] custom-scrollbar"
                  placeholder={`Responder a ${selectedContact.nome.split(" ")[0]}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  disabled={sendingMessage || !inputText.trim()}
                  onClick={handleSendMessage}
                  className="w-12 h-11 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:bg-orange-600 shadow-lg shadow-orange-600/20 shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
            <Bot size={48} className="opacity-10 mb-4 animate-pulse" />
            <h3 className="text-sm font-black text-white">Central de Mensagens</h3>
            <p className="text-[11px] text-zinc-500 text-center max-w-[300px] mt-1 leading-relaxed">
              Selecione um colaborador na lista lateral para visualizar e interagir no canal seguro do portal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
