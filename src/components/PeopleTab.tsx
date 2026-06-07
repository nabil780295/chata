import React, { useState, useEffect } from "react";
import { Compass, Star, MapPin, Heart, Clock, Search, Sparkles } from "lucide-react";
import { Persona } from "../types";
import { getPersonas } from "../lib/store";

interface PeopleTabProps {
  onSelectPersona: (persona: Persona) => void;
  refreshFlag: number;
}

export default function PeopleTab({ onSelectPersona, refreshFlag }: PeopleTabProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filterCriteria, setFilterCriteria] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setPersonas(getPersonas());
  }, [refreshFlag]);

  // Handle active status filtration or basic location subsets
  const filteredPersonas = personas.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.bengaliName.includes(searchQuery) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterCriteria === "all") return matchesSearch;
    if (filterCriteria === "online") return p.status === "Online" && matchesSearch;
    if (filterCriteria === "dhaka") return p.location.includes("Dhaka") && matchesSearch;
    
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0C0E]" id="people_tab_view">
      
      {/* Title & Filter Segment */}
      <div className="px-4 pt-4 pb-2 select-none flex-shrink-0">
        <h1 className="text-2xl font-black text-gray-100 flex items-center space-x-2 tracking-tight">
          <span>People</span>
          <span className="text-pink-500 font-mono text-xs bg-pink-500/10 px-2 py-0.5 rounded-full mt-0.5">Explore Profiles</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Discover virtual AI partners with highly specialized personalities and interests.</p>
      </div>

      {/* Inline Search Filter row */}
      <div className="px-4 py-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters by name..." 
            className="w-full bg-[#18191A] text-xs py-2 px-9 rounded-full focus:outline-none focus:ring-1 focus:ring-pink-500 text-gray-200 placeholder-gray-500 border border-gray-800"
          />
        </div>

        {/* Tab Filter Pills selection */}
        <div className="flex space-x-1.5 self-center">
          <button 
            onClick={() => setFilterCriteria("all")}
            className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-mono transition ${
              filterCriteria === "all" ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterCriteria("online")}
            className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-mono transition ${
              filterCriteria === "online" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Online
          </button>
          <button 
            onClick={() => setFilterCriteria("dhaka")}
            className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-mono transition ${
              filterCriteria === "dhaka" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Dhaka
          </button>
        </div>
      </div>

      {/* Grid List Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-20" id="people_cards_scroller">
        {filteredPersonas.length === 0 ? (
          <div className="text-center py-16 select-none bg-gray-900/10 p-5 rounded-2xl border border-gray-800/15">
            <Compass className="w-10 h-10 text-gray-700 mx-auto mb-2.5 animate-spin" />
            <p className="text-gray-500 text-xs font-sans">No matching profiles found in this area.</p>
            <button onClick={() => { setFilterCriteria("all"); setSearchQuery(""); }} className="text-pink-500 text-xs mt-2 underline">
              View All Partners
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPersonas.map((persona) => (
              <div 
                key={persona.id}
                className="bg-[#18191A] rounded-2xl p-4 border border-gray-800/40 shadow-md flex flex-col justify-between hover:border-pink-500/30 transition duration-200 select-none group"
              >
                <div>
                  
                  {/* Top Header Card Info Row */}
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <img 
                        src={persona.avatar} 
                        alt={persona.name} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-800 shadow"
                        referrerPolicy="no-referrer"
                      />
                      {persona.status === "Online" && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#18191A] rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 justify-between">
                        <h3 className="font-bold text-sm text-gray-100 truncate flex items-baseline space-x-1.5 leading-none">
                          <span>{persona.name}</span>
                          <span className="text-gray-400 font-normal text-xs font-sans">({persona.bengaliName})</span>
                        </h3>
                        <span className="text-[10px] text-pink-400 font-mono flex-shrink-0 flex items-center">
                          <Star className="w-2.5 h-2.5 pr-0.5 fill-pink-500 text-pink-500" /> {persona.age} yrs
                        </span>
                      </div>

                      {/* Map Location point */}
                      <p className="text-[10px] text-gray-500 flex items-center mt-1.5 font-sans truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-600 mr-0.5" />
                        <span>{persona.location}</span>
                      </p>

                      <span className="inline-block mt-1.5 bg-pink-950/30 text-pink-300 text-[8px] tracking-wider uppercase font-mono px-2 py-0.5 rounded-full border border-pink-900/10">
                        {persona.zodiac}
                      </span>
                    </div>
                  </div>

                  {/* Character Bio Block */}
                  <p className="text-xs text-gray-400 mt-3 font-sans leading-relaxed italic bg-gray-950/20 p-2.5 rounded-xl border border-gray-800/30">
                    "{persona.bio}"
                  </p>

                  {/* Hobbies list dots */}
                  <div className="mt-3">
                    <span className="block text-[9px] uppercase font-mono text-gray-500 tracking-wider">Interests</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {persona.hobbies.map((h, i) => (
                        <span key={i} className="bg-gray-800 text-[9px] text-gray-300 font-sans px-2.5 py-0.5 rounded-md border border-gray-700/20">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card CTA Block */}
                <div className="mt-4 pt-3.5 border-t border-gray-800/25">
                  <button 
                    onClick={() => onSelectPersona(persona)}
                    className="w-full bg-pink-600/10 hover:bg-pink-600 text-pink-400 hover:text-white text-xs py-2 rounded-xl text-center font-bold tracking-wide transition duration-150 flex items-center justify-center space-x-1.5 focus:outline-none"
                    id={`chat_now_card_btn_${persona.id}`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                    <span>Start Sweet Chat</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
