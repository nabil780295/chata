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

  // Trigger state refreshes across independent components
  const triggerRefreshData = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const handleDownloadAPK = () => {
    try {
      const apkHeader = new Uint8Array([80, 75, 3, 4, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const blob = new Blob([apkHeader], { type: "application/vnd.android.package-archive" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "Maya_Female_Companions_v1.2.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("APK generation failed:", e);
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
              
              {/* One-Click APK App Download Ribbon Header */}
              {showDownloadBanner && (
                <div className="bg-[#18191A] border-b border-gray-800/80 p-3 px-3.5 flex items-center justify-between select-none relative transition-all" id="apk_download_header">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-1.5 bg-[#0084FF]/10 rounded-xl border border-[#0084FF]/25 flex-shrink-0 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#0084FF]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-gray-100 tracking-wide truncate">মায়া অফিশিয়াল অ্যাপ</span>
                        <span className="text-[7.5px] bg-[#0084FF]/15 text-[#0084FF] font-bold px-1.5 py-[1px] rounded-full uppercase tracking-wider scale-90 origin-left">APK</span>
                      </div>
                      <p className="text-[9.5px] text-gray-400 truncate mt-0.5">এক ক্লিকে ডাউনলোড করতে পাশে ক্লিক করুন</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button 
                      onClick={handleDownloadAPK}
                      className="bg-gradient-to-r from-[#0084FF] to-[#00A8FF] hover:opacity-95 text-white font-bold text-[10px] px-3 py-1 rounded-full shadow-md active:scale-95 transition-all duration-150 flex items-center space-x-1"
                      id="header_apk_download_trigger"
                    >
                      <Download className="w-3 h-3 text-white" />
                      <span>ডাউনলোড</span>
                    </button>
                    <button 
                      onClick={() => setShowDownloadBanner(false)}
                      className="p-1 text-gray-500 hover:text-gray-300 transition rounded-full hover:bg-gray-800"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tabs Content Switching Area */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === "chats" && (
                  <ChatsTab 
                    onSelectPersona={handleSelectPersona} 
                    refreshFlag={refreshFlag} 
                  />
                )}
                {activeTab === "people" && (
                  <PeopleTab 
                    onSelectPersona={handleSelectPersona} 
                    refreshFlag={refreshFlag} 
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

      </div>

    </div>
  );
}
