import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Phone, Video, Info, Send, Smile, Image, Compass, HelpCircle, Heart, Star, MapPin, Sparkles, Check, CheckCheck
} from "lucide-react";
import { Persona, Message, Conversation } from "../types";
import { addMessage, getMessages, incrementUnreadCount, clearUnreadCount, saveMessages } from "../lib/store";
import { motion, AnimatePresence } from "motion/react";

interface ActiveChatProps {
  persona: Persona;
  onBack: () => void;
  triggerRefreshConversations: () => void;
}

export default function ActiveChat({ persona, onBack, triggerRefreshConversations }: ActiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showReactionsIndex, setShowReactionsIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = `conv_${persona.id}_guest`;

  // Preloaded reaction emojis
  const REACTION_EMOJIS = ["❤️", "😆", "😮", "😢", "😠", "👍", "🔥"];

  // Fetch messages and setup conversation metadata
  useEffect(() => {
    const chatMsgs = getMessages(conversationId);
    setMessages(chatMsgs);
    clearUnreadCount(conversationId);
    triggerRefreshConversations();

    // If conversation is empty, create initial welcome message
    if (chatMsgs.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        const welcomeText = `Hi sweetie! ${persona.bengaliName} speaks here. 🥰 ${persona.bio.split(".")[0]}. Let's chat! Speak to me about anything. Tumi ki korcho bolo?`;
        const initialMsg = addMessage(conversationId, welcomeText, "bot", persona.name);
        setMessages([initialMsg]);
        setIsTyping(false);
        triggerRefreshConversations();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [persona.id]);

  // Scroll to bottom whenever messages list or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string, attachmentUrl?: string) => {
    const finalTxt = textToSend !== undefined ? textToSend : inputText;
    if (!finalTxt.trim() && !attachmentUrl) return;

    // 1. Save user message locally
    const userMsg = addMessage(conversationId, finalTxt, "user", "You", attachmentUrl);
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    triggerRefreshConversations();

    // 2. Trigger typing animation sequence
    setIsTyping(true);

    // Prepare conversation logs history for API context matching (up to 8 messages to keep prompt size optimized)
    const recentHistory = messages.slice(-8).map(m => ({
      role: (m.senderId === "user" ? "user" : "model") as "user" | "model",
      text: m.text
    }));

    try {
      // Fetch Gemini AI reply via server-side secure bridge endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalTxt,
          history: recentHistory,
          persona: persona
        })
      });

      const data = await response.json();
      setIsTyping(false);

      // Save AI response locally
      const botMsg = addMessage(conversationId, data.text || "Hehe reply dita parlam na, please ask again! 💕", "bot", persona.name);
      setMessages(p => [...p, botMsg]);
      triggerRefreshConversations();

      // Send browser push notification if supported
      triggerLocalNotification(persona.name, data.text);
    } catch (err) {
      console.error("AI reply dispatch failed. Using sweet client mock reply:", err);
      setIsTyping(false);
      const botMsg = addMessage(conversationId, `Aww babe, network e ektu problem hocche mone hoy! But tumi bolo, amra kintu awesome chat korchi! 😘`, "bot", persona.name);
      setMessages(p => [...p, botMsg]);
      triggerRefreshConversations();
    }
  };

  // Trigger a rich local browser notification (with sound visualizer) to emulate push messaging
  const triggerLocalNotification = (name: string, content: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`New message from ${name}`, {
        body: content,
        icon: persona.avatar,
        tag: "maya_chat"
      });
    }
  };

  // Simulate sharing a photo (or requesting a gorgeous selfie from the companion)
  const handleRequestSelfie = () => {
    const alertMessage = `Asking ${persona.name} for a photo... 📸`;
    const randomScenicSelfies = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=400",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300&h=400",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=400",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300&h=400",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300&h=400"
    ];
    const pickedSelfie = randomScenicSelfies[Math.floor(Math.random() * randomScenicSelfies.length)];
    
    // User message triggered asking for selfie
    handleSendMessage(`Hey ${persona.name}, can you send me a cute picture? 💖`);
    
    // Mock the image receipt after a 3s delay
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const botImageMsg = addMessage(
          conversationId, 
          `Look what I took just for you! Hope you like my selfie. 🥰 Let me know how I look!`, 
          "bot", 
          persona.name, 
          pickedSelfie
        );
        setMessages(p => [...p, botImageMsg]);
        triggerRefreshConversations();
      }, 2000);
    }, 2800);
  };

  // Inline emoji message reactions toggles
  const toggleReaction = (msgIndex: number, emoji: string) => {
    const updated = [...messages];
    const targetMsg = updated[msgIndex];
    if (!targetMsg.reactions) {
      targetMsg.reactions = [];
    }
    
    // If emoji exists, remove it, else add it
    if (targetMsg.reactions.includes(emoji)) {
      targetMsg.reactions = targetMsg.reactions.filter(e => e !== emoji);
    } else {
      targetMsg.reactions = [emoji]; // Replace or add single
    }
    
    updated[msgIndex] = targetMsg;
    setMessages(updated);
    saveMessages(conversationId, updated);
    setShowReactionsIndex(null);
  };

  return (
    <div className="flex h-full w-full bg-[#0B0C0E] text-white overflow-hidden relative" id="active_chat_viewer">
      
      {/* Main Chat Feed */}
      <div className={`flex flex-col flex-1 h-full w-full ${showInfo ? "hidden md:flex" : "flex"}`}>
        
        {/* Interactive Top Bar / Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#18191A] border-b border-gray-800/40 select-none shadow-md z-12" id="chat_header_rail">
          <div className="flex items-center space-x-2">
            <button 
              onClick={onBack} 
              className="p-1 px-1.5 focus:outline-none hover:bg-gray-800 rounded-full transition duration-150"
              id="back_to_chats_btn"
            >
              <ArrowLeft className="w-5 h-5 text-[#0084FF]" />
            </button>
            
            {/* Companion Contact Badge */}
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
              <div className="relative">
                <img 
                  src={persona.avatar} 
                  alt={persona.name} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-700/60 shadow-inner"
                  referrerPolicy="no-referrer"
                />
                {persona.status === "Online" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-[2px] border-[#18191A] rounded-full"></span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-sm tracking-wide text-gray-100">{persona.name}</span>
                  <span className="text-xs text-gray-400">({persona.bengaliName})</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono tracking-tight flex items-center space-x-1">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                  {persona.status}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center space-x-3.5 pr-1">
            <button onClick={() => alert("Connecting secure voice tunnel to Maya companion...")} className="text-[#0084FF] hover:opacity-85 focus:outline-none p-1.5">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => alert("Initiating high-contrast video avatar stream...")} className="text-[#0084FF] hover:opacity-85 focus:outline-none p-1.5">
              <Video className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowInfo(!showInfo)} 
              className={`p-1.5 rounded-full ${showInfo ? "bg-[#0084FF]/20 text-[#0084FF]" : "text-gray-300"} hover:bg-gray-800 transition duration-150`}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Panel Scroll View */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-[#0B0C0E]" id="messages_scroll_feed">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser = msg.senderId === "user";
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-end space-x-2 relative group`}
                >
                  {/* Bots profile avatar appearing left of their text columns */}
                  {!isUser && (
                    <img 
                      src={persona.avatar} 
                      alt="" 
                      className="w-7 h-7 rounded-full object-cover border border-gray-800/80 mb-0.5"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="flex flex-col max-w-[70%] relative">
                    
                    {/* Reaction trigger hover widget on desktop, click overlay on mobile */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[-32px] group-hover:opacity-100 opacity-0 transition duration-150 cursor-pointer text-gray-500 hover:text-white"
                      style={{ display: isUser ? 'none' : 'block' }}
                      onClick={() => setShowReactionsIndex(showReactionsIndex === idx ? null : idx)}
                    >
                      <Smile className="w-4 h-4" />
                    </div>

                    {/* Dynamic Reactions list popup overlay */}
                    {showReactionsIndex === idx && (
                      <div className="absolute bottom-full left-0 mb-1 bg-[#242526] p-1.5 rounded-full shadow-2xl flex space-x-1.5 z-50 border border-gray-700">
                        {REACTION_EMOJIS.map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => toggleReaction(idx, emoji)}
                            className="hover:scale-130 transition duration-100 text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Chat Bubble Card Core */}
                    <div 
                      className={`px-3.5 py-2.5 rounded-2xl relative shadow-sm ${
                        isUser 
                          ? "bg-[#0084FF] text-white rounded-br-none" 
                          : "bg-[#242526] text-gray-100 rounded-bl-none border border-gray-800/20"
                      }`}
                    >
                      {/* Shared visual attachments */}
                      {msg.attachmentUrl && (
                        <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-gray-700/40">
                          <img 
                            src={msg.attachmentUrl} 
                            alt="Shared Attachment" 
                            className="w-full max-h-56 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                      {/* Message Text markup */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>
                      
                      {/* Attached reaction bubble badge display */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="absolute bottom-[-10px] right-2 bg-[#242526] text-[10px] px-1.5 py-0.5 rounded-full border border-gray-700/60 shadow-lg flex items-center space-x-0.5 select-none animate-bounce">
                          {msg.reactions.map((r, i) => <span key={i}>{r}</span>)}
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp detail line */}
                    <span className={`text-[9px] text-gray-500 font-mono mt-1 ${isUser ? "text-right mr-1" : "text-left ml-1"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isUser && (
                        <span className="inline-block ml-1 text-[#0084FF]">
                          {idx === messages.length - 1 ? <CheckCheck className="w-3 h-3 inline pb-0.5" /> : <Check className="w-3 h-3 inline pb-0.5" />}
                        </span>
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Companion Typist flashing animation container */}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-end space-x-2"
            >
              <img 
                src={persona.avatar} 
                alt="" 
                className="w-7 h-7 rounded-full object-cover border border-gray-800"
                referrerPolicy="no-referrer"
              />
              <div className="bg-[#242526] px-3.5 py-3 rounded-2xl rounded-bl-none border border-gray-800/20 max-w-[120px]">
                <div className="flex space-x-1.5 justify-center items-center py-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Control Composer */}
        <div className="p-3 bg-[#18191A] border-t border-gray-800/50 flex flex-col space-y-1.5 z-10 shadow-inner" id="chat_composer_rail">
          <div className="flex items-center space-x-2.5">
            
            {/* Selfie Request Quick tool */}
            <button 
              onClick={handleRequestSelfie}
              className="p-2 text-pink-500 hover:bg-gray-800 active:scale-95 rounded-full transition focus:outline-none flex-shrink-0"
              title="Request a Selfie!"
              id="selfie_request_btn"
            >
              <Image className="w-5 h-5 text-purple-400" />
            </button>

            {/* Quick pre-baked messages */}
            <div className="flex-1 flex overflow-x-auto space-x-1.5 scrollbar-none py-1">
              <button 
                onClick={() => setInputText("Hi beautiful! 🌸 Tumi kamon acho?")}
                className="bg-gray-800 hover:bg-gray-700/80 text-[11px] px-2.5 py-1 rounded-full text-gray-300 border border-gray-700/20 flex-shrink-0"
              >
                Kamon acho? 🌸
              </button>
              <button 
                onClick={() => setInputText("I had a very busy day today... 🥺 Please cheer me up!")}
                className="bg-gray-800 hover:bg-gray-700/80 text-[11px] px-2.5 py-1 rounded-full text-gray-300 border border-gray-700/20 flex-shrink-0"
              >
                Busy day... 🥺
              </button>
              <button 
                onClick={() => setInputText("Ki korcho babe? Let's have coffee! ☕")}
                className="bg-gray-800 hover:bg-gray-700/80 text-[11px] px-2.5 py-1 rounded-full text-gray-300 border border-gray-700/20 flex-shrink-0"
              >
                Ki korcho? ☕
              </button>
            </div>
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="flex items-center bg-[#242526] rounded-full px-3.5 py-1.5 border border-gray-800/40 relative"
            id="chat_text_composer_form"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send message to ${persona.name}... (Bengali or English)`}
              className="bg-transparent flex-1 focus:outline-none text-sm text-gray-100 placeholder-gray-500 pr-5"
              id="message_text_input"
            />
            
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className={`p-1.5 rounded-full focus:outline-none transition ${
                inputText.trim() 
                  ? "text-[#0084FF] hover:bg-[#0084FF]/15 active:scale-90" 
                  : "text-gray-600 cursor-default"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>

      {/* Profile detail Info Side Panel */}
      {showInfo && (
        <div 
          className="w-full md:w-80 h-full bg-[#18191A] border-l border-gray-800/40 flex flex-col p-5 overflow-y-auto select-none z-10 animate-fade-in"
          id="chat_companion_info_panel"
        >
          <div className="flex justify-between items-center md:hidden mb-4">
            <button 
              onClick={() => setShowInfo(false)} 
              className="p-1 px-1.5 focus:outline-none hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <span className="font-semibold text-sm">Bio Details</span>
            <div className="w-5"></div>
          </div>

          <div className="flex flex-col items-center text-center space-y-3.5 mb-6">
            <img 
              src={persona.avatar} 
              alt={persona.name} 
              className="w-24 h-24 rounded-full object-cover border-2 border-[#0084FF]/60 shadow-xl"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-lg text-gray-100 flex items-center justify-center space-x-1.5">
                <span>{persona.name}</span>
                <span className="text-[#0084FF] text-sm font-light">({persona.bengaliName})</span>
              </h3>
              <p className="text-xs text-gray-400">{persona.location}</p>
            </div>
            
            <div className="flex space-x-2.5">
              <span className="bg-gray-800 text-gray-300 text-[10px] px-2.5 py-1 rounded-full border border-gray-700/35">Age: {persona.age}</span>
              <span className="bg-purple-900/40 text-purple-300 text-[10px] px-2.5 py-1 rounded-full border border-purple-800/30 font-mono">{persona.zodiac}</span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-gray-500 block uppercase font-mono tracking-wider text-[10px] mb-1.5">Personal Bio</span>
              <p className="text-gray-300 bg-gray-800/30 p-2.5 rounded-lg border border-gray-800/80 leading-relaxed font-sans">{persona.bio}</p>
            </div>

            <div>
              <span className="text-gray-500 block uppercase font-mono tracking-wider text-[10px] mb-1.5">Personality Profile</span>
              <p className="text-gray-300 bg-gray-800/30 p-2.5 rounded-lg border border-gray-800/80 leading-relaxed font-sans">{persona.personality}</p>
            </div>

            <div>
              <span className="text-gray-500 block uppercase font-mono tracking-wider text-[10px] mb-1.5">Hobbies & Interests</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {persona.hobbies.map((h, i) => (
                  <span key={i} className="bg-gray-800 text-[#0084FF] text-[10px] px-2.5 py-1 rounded-md border border-gray-700/20 font-sans">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-blue-950/20 p-3 rounded-lg border border-blue-900/30 flex space-x-2 text-[11px] text-blue-300 items-start leading-relaxed animate-pulse">
                <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
                <span>
                  <strong>Maya Twin Engine</strong> utilizes Gemini 3.5 LLMs for smart and engaging responses.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
