import React, { useState, useEffect } from "react";
import { Search, Plus, MessageSquare, Flame, Laptop, Video, Clock, Download } from "lucide-react";
import { Persona, Conversation, Story } from "../types";
import { getPersonas, getStories, getConversations, getOrCreateConversation, saveStory } from "../lib/store";
import { motion, AnimatePresence } from "motion/react";

interface ChatsTabProps {
  onSelectPersona: (persona: Persona) => void;
  refreshFlag: number;
  onDownloadAPK?: () => void;
}

export default function ChatsTab({ onSelectPersona, refreshFlag, onDownloadAPK }: ChatsTabProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [newStoryText, setNewStoryText] = useState("");
  const [showAddStory, setShowAddStory] = useState(false);

  // Sync state data on refresh flag trigger or mount
  useEffect(() => {
    setPersonas(getPersonas());
    setStories(getStories());
    setConversations(getConversations());
  }, [refreshFlag]);

  // Combine personas with their corresponding conversations to display Messenger row
  const chatsList = personas.map(p => {
    // Find matching conversation metadata
    const conv = conversations.find(c => c.personaId === p.id);
    return {
      persona: p,
      conversation: conv || {
        id: `conv_${p.id}_guest`,
        userId: "guest_user",
        personaId: p.id,
        lastMessage: "Tap to start conversation! 👋",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      }
    };
  });

  // Filter based on search criteria
  const filteredChats = chatsList.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.persona.name.toLowerCase().includes(term) ||
      item.persona.bengaliName.includes(term) ||
      item.persona.location.toLowerCase().includes(term) ||
      item.persona.bio.toLowerCase().includes(term)
    );
  });

  // Handle addition of a custom story by the user
  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim()) return;

    const randomStoryMedia = [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=500&h=800",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=500&h=800",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=500&h=800"
    ];

    const pickMedia = randomStoryMedia[Math.floor(Math.random() * randomStoryMedia.length)];

    const userStory: Story = {
      id: "story_user_" + Math.random().toString(36).substring(2, 9),
      personaId: "user",
      name: "My Story",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100",
      mediaUrl: pickMedia,
      text: newStoryText,
      createdAt: new Date().toISOString()
    };

    const updated = saveStory(userStory);
    setStories(updated);
    setNewStoryText("");
    setShowAddStory(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0C0E]" id="chats_tab_view">
      
      {/* Top Messenger Brand Title */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between select-none">
        <h1 className="text-2xl font-black text-gray-100 flex items-center space-x-2 tracking-tight">
          <span>Chats</span>
          <span className="text-[#0084FF] text-xs bg-[#0084FF]/10 px-2 py-0.5 rounded-full font-mono mt-0.5">Maya v1.2</span>
        </h1>
        <div className="flex items-center space-x-2">
          {onDownloadAPK && (
            <button 
              onClick={onDownloadAPK}
              className="p-1 px-3 bg-[#0084FF] hover:bg-[#0084FF]/95 text-white rounded-full text-xs font-bold flex items-center space-x-1 transition duration-150 shadow-md animate-pulse shrink-0"
              id="chats_header_download"
              title="ডাউনলোড অ্যাপ"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>ডাউনলোড</span>
            </button>
          )}
          <button 
            onClick={() => setShowAddStory(true)}
            className="p-1 px-2.5 bg-[#242526] hover:bg-gray-800 rounded-full text-xs text-gray-200 border border-gray-800 flex items-center space-x-1 transition duration-150 shrink-0"
            id="create_story_action_tab"
          >
            <Plus className="w-3.5 h-3.5 text-[#0084FF]" />
            <span>Story</span>
          </button>
        </div>
      </div>

      {/* Modern Round Search Bar */}
      <div className="px-4 py-2 relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search female AI companions, locations, bios..." 
            className="w-full bg-[#242526] hover:bg-gray-800/80 text-sm py-2 px-10 rounded-full text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0084FF] border border-transparent transition duration-150"
            id="search_chats_input"
          />
        </div>
      </div>

      {/* Scrollable Feed Core */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-16">
        
        {/* Horizontal Stories Panel */}
        <div className="px-4 py-2 border-b border-gray-900/30 select-none pb-4" id="messenger_stories_list">
          <div className="flex space-x-4 overflow-x-auto scrollbar-none py-1">
            
            {/* User "Add Story" Button Cell */}
            <div className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer" onClick={() => setShowAddStory(true)}>
              <div className="relative w-14 h-14 bg-gray-800 rounded-full border border-dashed border-gray-700 flex items-center justify-center hover:border-[#0084FF]">
                <Plus className="w-5 h-5 text-[#0084FF]" />
              </div>
              <span className="text-[10px] text-gray-400 font-sans tracking-tight">Your Story</span>
            </div>

            {/* AI Companion Active Stories List */}
            {stories.map(story => (
              <div 
                key={story.id} 
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer"
              >
                <div className="relative p-[1.5px] rounded-full border-[2.5px] border-[#0084FF] hover:opacity-85 transition">
                  <img 
                    src={story.avatarUrl} 
                    alt={story.name} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-900"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute right-0 bottom-0 bg-red-500 border border-gray-900 text-[8px] rounded-full px-1 flex items-center justify-center animate-pulse">
                    <Flame className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <span className="text-[10px] text-gray-300 font-medium tracking-tight font-sans">
                  {story.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chats Rows Section Header */}
        <div className="px-4 flex items-center justify-between text-gray-500 text-[10px] tracking-wider font-mono uppercase">
          <span>Recent Conversations</span>
          <span>{filteredChats.length} accounts</span>
        </div>

        {/* Chats Rows Feed */}
        <div className="px-2 space-y-1.5" id="chats_feed_container">
          {filteredChats.length === 0 ? (
            <div className="text-center py-10 select-none">
              <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">No active chats match your search query.</p>
              <button 
                onClick={() => setSearchTerm("")} 
                className="mt-2 text-[#0084FF] text-xs hover:underline focus:outline-none font-sans"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredChats.map(({ persona, conversation }) => {
              const hasUnread = conversation.unreadCount > 0;
              const formattedTime = new Date(conversation.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={persona.id}
                  onClick={() => onSelectPersona(persona)}
                  className="flex items-center space-x-3.5 p-3 hover:bg-[#18191A] rounded-xl cursor-pointer select-none transition duration-150 group"
                >
                  {/* Persona Avatar block with status ring */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={persona.avatar} 
                      alt={persona.name} 
                      className="w-13 h-13 rounded-full object-cover border border-gray-800"
                      referrerPolicy="no-referrer"
                    />
                    {persona.status === "Online" && (
                      <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#0B0C0E] rounded-full group-hover:border-[#18191A]"></span>
                    )}
                  </div>

                  {/* Messaging metadata text columns */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-semibold text-sm text-gray-100 flex items-center space-x-1.5 truncate">
                        <span>{persona.name}</span>
                        <span className="text-gray-400 font-normal text-xs">({persona.bengaliName})</span>
                      </h4>
                      <span className={`text-[10px] font-mono ${hasUnread ? "text-[#0084FF] font-bold" : "text-gray-500"}`}>
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${hasUnread ? "text-gray-100 font-bold" : "text-gray-400"}`}>
                        {conversation.lastMessage}
                      </p>
                      
                      {/* Bold badge container for unread counts */}
                      {hasUnread && (
                        <span className="bg-[#0084FF] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce mr-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    {/* Location detail label */}
                    <span className="text-[9px] text-gray-500 flex items-center mt-1 font-sans">
                      <span className="inline-block w-1 h-1 bg-gray-700 rounded-full mr-1"></span>
                      {persona.location}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Dynamic Popover modal for Stories Overlay */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 select-none"
            id="story_overlay_display"
          >
            <div className="relative w-full max-w-sm h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col bg-[#111]">
              
              {/* Progress bar simulation */}
              <div className="absolute top-3 left-4 right-4 flex space-x-1 z-30">
                <div className="h-0.5 bg-[#0084FF] flex-1 rounded-full"></div>
                <div className="h-0.5 bg-gray-700 flex-1 rounded-full"></div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setSelectedStory(null)}
                className="absolute top-5 right-5 z-30 bg-black/50 p-2 rounded-full text-white hover:bg-gray-800 transition focus:outline-none"
              >
                ✕
              </button>

              {/* Story Content View */}
              <img 
                src={selectedStory.mediaUrl} 
                alt="" 
                className="w-full h-full object-cover absolute inset-0"
                referrerPolicy="no-referrer"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10"></div>

              {/* Story Author Meta Header */}
              <div className="absolute top-6 left-5 z-20 flex items-center space-x-2.5">
                <img 
                  src={selectedStory.avatarUrl} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#0084FF]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-100">{selectedStory.name}</h4>
                  <span className="text-[9px] text-gray-400 font-mono">Posted moments ago</span>
                </div>
              </div>

              {/* Story Caption footer label */}
              <div className="absolute bottom-6 left-5 right-5 z-20">
                <p className="text-sm text-gray-100 font-sans leading-relaxed text-center drop-shadow-md bg-black/40 p-3.5 rounded-2xl border border-gray-800/40">
                  {selectedStory.text}
                </p>
                
                <button 
                  onClick={() => {
                    const matchedPersona = personas.find(p => p.id === selectedStory.personaId);
                    if (matchedPersona) {
                      onSelectPersona(matchedPersona);
                    }
                    setSelectedStory(null);
                  }}
                  className="mt-4 w-full bg-[#0084FF] hover:bg-blue-600 font-semibold text-xs py-2 rounded-full text-center tracking-wide block cursor-pointer"
                >
                  Reply in Chat
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Modal overlay for Adding Stories */}
      <AnimatePresence>
        {showAddStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            id="add_story_overlay"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#18191A] w-full max-w-sm rounded-2xl p-5 border border-gray-800 relative shadow-2xl"
            >
              <h3 className="text-md font-bold mb-3">Add to My Story</h3>
              <form onSubmit={handleAddStory} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-mono uppercase mb-1">Story Caption</label>
                  <textarea 
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    placeholder="What is on your mind? Type a cozy caption... 🌸"
                    className="w-full bg-[#242526] text-sm p-3 rounded-xl text-gray-100 focus:outline-none border border-gray-800 resize-none h-24"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="text-[11px] text-purple-400 bg-purple-950/20 p-2.5 rounded-lg border border-purple-900/20 flex space-x-1">
                  <Laptop className="w-4 h-4 flex-shrink-0" />
                  <span>A gorgeous background scenery will be generated matching the story!</span>
                </div>

                <div className="flex space-x-2.5 pt-1">
                  <button 
                    type="button"
                    onClick={() => setShowAddStory(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-xs py-2 rounded-full focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#0084FF] hover:bg-blue-600 text-xs py-2 rounded-full font-semibold focus:outline-none"
                  >
                    Post Story
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
