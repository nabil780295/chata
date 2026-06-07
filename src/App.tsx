import React, { useState, useEffect } from "react";
import { MessageCircle, Users, Menu, Sparkles, MessageSquare, Compass, Download, X } from "lucide-react";
import { Persona } from "./types";
import ChatsTab from "./components/ChatsTab";
import PeopleTab from "./components/PeopleTab";
import SettingsTab from "./components/SettingsTab";
import ActiveChat from "./components/ActiveChat";
import { getConversations, saveConversations, clearUnreadCount } from "./lib/store";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chats" | "people" | "settings">("chats");
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [showDownloadBanner, setShowDownloadBanner] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);

  // Register service worker on mount for PWA compatibility
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered with scope: ", reg.scope);
        })
        .catch((err) => {
          console.error("PWA Service Worker registration failed: ", err);
        });
    }
  }, []);

  // Listen for the beforeinstallprompt browser event trigger
  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      // Prevent browser standalone fallback
      e.preventDefault();
      // Stash prompt event block
      setDeferredPrompt(e);
      // Ensure banner remains helper-friendly and visible
      setShowDownloadBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // Auto-detect if user running in standalone installed session
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowDownloadBanner(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  // Trigger state refreshes across independent components
  const triggerRefreshData = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const handleDownloadAPK = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the home screen installation prompt.");
          setDeferredPrompt(null);
          setShowDownloadBanner(false);
        } else {
          console.log("User dismissed the home screen installation.");
        }
      } catch (err) {
        console.error("Installation request failed:", err);
        setShowPwaInstallModal(true);
      }
    } else {
      // If prompt didn't fire due to browser constraints, provide manual fallback steps
      setShowPwaInstallModal(true);
    }
  };

  // Compute total global unread count for bottom notifications badge
  useEffect(() => {
    const list = getConversations();
    const count = list.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
    setGlobalUnreadCount(count);
  }, [refreshFlag, activePersona]);

  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    // Clear unread counts for this conversation session immediately
    const convId = `conv_${persona.id}_guest`;
    clearUnreadCount(convId);
    triggerRefreshData();
  };

  const handleClearAllChatsHistory = () => {
    if (typeof window !== "undefined") {
      // Clear key prefix local messages
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("maya_messages_") || key.startsWith("maya_conversations")) {
          localStorage.removeItem(key);
        }
      });
      triggerRefreshData();
      alert("All chat logs purged successfully. 🧹");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#050608] font-sans overflow-hidden antialiased text-white selection:bg-[#0084FF] selection:text-white" id="maya_main_viewport">
      
      {/* Outer elegant mobile housing simulating an actual modern Android mockup */}
      <div className="w-full h-screen sm:max-w-[430px] sm:max-h-[880px] sm:rounded-[36px] sm:border-[8px] sm:border-[#1E2024] sm:shadow-2xl overflow-hidden relative flex flex-col bg-[#0B0C0E]">
        
        {/* Android Notch / Frame Camera decoration for high fidelity preview */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-gray-800 rounded-full border-2 border-gray-950 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-900 rounded-full"></div>
          </div>
        </div>

        {/* Dynamic Screen View routing inside the smartphone box */}
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col relative pt-1 sm:pt-4">
          {activePersona ? (
            <ActiveChat 
              persona={activePersona} 
              onBack={() => {
                setActivePersona(null);
                triggerRefreshData();
              }}
              triggerRefreshConversations={triggerRefreshData}
            />
          ) : (
            <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
              
              {/* Permanent 1-Click Installation Header */}
              <div className="bg-[#18191A] border-b border-[#0084FF]/20 p-3 px-3.5 flex items-center justify-between select-none relative" id="apk_download_header">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 bg-[#0084FF]/10 rounded-xl border border-[#0084FF]/25 flex-shrink-0 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-[#0084FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-gray-100 tracking-wide truncate">মায়া অফিশিয়াল অ্যাপ</span>
                      <span className="text-[7.5px] bg-[#0084FF]/15 text-[#0084FF] font-bold px-1.5 py-[1px] rounded-full uppercase tracking-wider scale-90 origin-left">INSTALL</span>
                    </div>
                    <p className="text-[9px] text-gray-400 truncate mt-0.5">১-ক্লিকে অ্যাপটি সরাসরি আপনার ফোনে যুক্ত করুন</p>
                  </div>
                </div>
                
                <div className="flex items-center flex-shrink-0">
                  <button 
                    onClick={handleDownloadAPK}
                    className="bg-gradient-to-r from-[#0084FF] to-[#00A8FF] hover:from-[#00A8FF] hover:to-[#0084FF] text-white font-bold text-[10px] px-3.5 py-1.5 rounded-full shadow-lg shadow-[#0084FF]/20 active:scale-95 transition-all duration-150 flex items-center space-x-1 animate-bounce"
                    id="header_apk_download_trigger"
                  >
                    <Download className="w-3 h-3 text-white" />
                    <span>যুক্ত করুন</span>
                  </button>
                </div>
              </div>

              {/* Tabs Content Switching Area */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === "chats" && (
                  <ChatsTab 
                    onSelectPersona={handleSelectPersona} 
                    refreshFlag={refreshFlag} 
                    onDownloadAPK={handleDownloadAPK}
                  />
                )}
                {activeTab === "people" && (
                  <PeopleTab 
                    onSelectPersona={handleSelectPersona} 
                    refreshFlag={refreshFlag} 
                    onDownloadAPK={handleDownloadAPK}
                  />
                )}
                {activeTab === "settings" && (
                  <SettingsTab 
                    onClearChats={handleClearAllChatsHistory} 
                    triggerRefresh={triggerRefreshData} 
                    refreshFlag={refreshFlag}
                    onDownloadAPK={handleDownloadAPK}
                  />
                )}
              </div>

              {/* Bottom Messenger-style Nav Tab Rail */}
              <div className="bg-[#18191A] border-t border-gray-800/40 py-2.5 px-6 flex items-center justify-between select-none z-10 shadow-lg" id="bottom_navigation_bar">
                
                {/* 1. Chats Pill */}
                <button 
                  onClick={() => setActiveTab("chats")}
                  className={`flex flex-col items-center justify-center outline-none relative group transform active:scale-95 transition-all ${
                    activeTab === "chats" ? "text-[#0084FF]" : "text-gray-500 hover:text-gray-300"
                  }`}
                  id="chats_nav_pill"
                >
                  <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {globalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#0084FF] text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center animate-pulse">
                        {globalUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium tracking-tight mt-1 font-sans">Chats</span>
                </button>

                {/* 2. People Pill */}
                <button 
                  onClick={() => setActiveTab("people")}
                  className={`flex flex-col items-center justify-center outline-none relative group transform active:scale-95 transition-all ${
                    activeTab === "people" ? "text-pink-500" : "text-gray-500 hover:text-gray-300"
                  }`}
                  id="people_nav_pill"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1 font-sans">People</span>
                </button>

                {/* 3. Menu Settings Pill */}
                <button 
                  onClick={() => setActiveTab("settings")}
                  className={`flex flex-col items-center justify-center outline-none relative group transform active:scale-95 transition-all ${
                    activeTab === "settings" ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  id="menu_nav_pill"
                >
                  <Menu className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-tight mt-1 font-sans">Menu</span>
                </button>

              </div>

            </div>
          )}
        </div>

        {/* PWA Instruction modal help */}
        {showPwaInstallModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4" id="pwa_instruction_modal">
            <div className="bg-[#18191A] border border-gray-800/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-[#0084FF] animate-pulse" />
                    <span className="font-bold text-sm text-gray-100">মায়াকে সরাসরি হোমসক্রিনে যুক্ত করুন</span>
                  </div>
                  <button 
                    onClick={() => setShowPwaInstallModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-800"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  আপনার ফোনে মায়া অফিশিয়াল অ্যাপ সরাসরি মোবাইল স্ক্রিনে যুক্ত করার জন্য নিচের পদক্ষেপগুলো ব্যবহার করুন:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-[#0084FF]/20 text-[#0084FF] text-xs font-bold flex items-center justify-center mt-0.5">১</div>
                    <div className="text-xs">
                      <span className="text-gray-100 font-bold block">Android / Chrome ব্রাউজার</span>
                      <p className="text-gray-400 mt-1">ব্রাউজারের উপরে ডানদিকের ৩টি ডট (<span className="font-bold text-[#0084FF]">⋮</span>) মেনুতে চাপুন এবং <b className="text-gray-200 font-semibold">"Install app"</b> অথবা <b className="text-gray-200 font-semibold">"Add to Home screen"</b> অপশনটিতে চাপুন।</p>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center mt-0.5">২</div>
                    <div className="text-xs">
                      <span className="text-gray-100 font-bold block">iPhone / Safari ব্রাউজার</span>
                      <p className="text-gray-400 mt-1">ব্রাউজারের নিচে শেয়ার (<span className="px-1.5 py-0.5 bg-gray-800 rounded font-bold">↑</span>) বাটনে চাপুন এবং একটু নিচে স্ক্রল করে <b className="text-gray-200 font-semibold">"Add to Home Screen"</b> এ আলতো চাপুন।</p>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center mt-0.5">৩</div>
                    <div className="text-xs">
                      <span className="text-gray-100 font-bold block">সরাসরি যুক্ত করার সুবিধা</span>
                      <p className="text-gray-400 mt-1">কোনো প্রকার ঝক্কি-ঝামেলা ছাড়াই হোমসক্রিন আইকনটিতে এক ক্লিকেই সরাসরি চ্যাট স্ক্রিনে প্রবেশ করতে পারবেন।</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPwaInstallModal(false)}
                  className="w-full bg-[#0084FF] hover:bg-[#0084FF]/90 text-white font-bold text-xs py-3 rounded-xl transition duration-150 relative active:scale-95"
                >
                  বুঝেছি, ধন্যবাদ! 👍
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
