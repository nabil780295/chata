import React, { useState, useEffect } from "react";
import { 
  User, Shield, Lock, Trash2, Edit2, Plus, Users, PlusCircle, LogIn, Key, Radio, Image, Globe, Check, CheckSquare, Sparkles, LogOut, RefreshCw, Download
} from "lucide-react";
import { Persona, Story, UserProfile } from "../types";
import { getPersonas, savePersona, deletePersona, getStories, saveStory, deleteStory, getUserProfile, saveUserProfile } from "../lib/store";
import { db, auth, isFirebaseEnabled } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

interface SettingsTabProps {
  onClearChats: () => void;
  triggerRefresh: () => void;
  refreshFlag: number;
  onDownloadAPK?: () => void;
}

export default function SettingsTab({ onClearChats, triggerRefresh, refreshFlag, onDownloadAPK }: SettingsTabProps) {
  // Profiles states
  const [profile, setProfile] = useState<UserProfile>({ uid: "guest", displayName: "Nabil", isGuest: true, avatarUrl: "", createdAt: "" });
  const [nicknameInput, setNicknameInput] = useState("");
  
  // Auth Form toggles
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNickname, setAuthNickname] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Protected Admin Portal states
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Admin Profile/Story Management lists
  const [adminPersonas, setAdminPersonas] = useState<Persona[]>([]);
  const [adminStories, setAdminStories] = useState<Story[]>([]);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // New Profile Form states
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newBengaliName, setNewBengaliName] = useState("");
  const [newAge, setNewAge] = useState(21);
  const [newAvatar, setNewAvatar] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newPersonality, setNewPersonality] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newLocation, setNewLocation] = useState("Dhaka");
  const [newZodiac, setNewZodiac] = useState("Pisces ♓");
  const [newHobbies, setNewHobbies] = useState("");

  // Sync profile details
  useEffect(() => {
    const usr = getUserProfile();
    setProfile(usr);
    setNicknameInput(usr.nickname || usr.displayName);
    setAdminPersonas(getPersonas());
    setAdminStories(getStories());
  }, [refreshFlag]);

  // Update customer nickname profile
  const handleUpdateNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    const updated = { ...profile, nickname: nicknameInput, displayName: nicknameInput };
    saveUserProfile(updated);
    setProfile(updated);
    triggerRefresh();
    alert("Nickname updated successfully! Your AI companions will call you by this nickname. 🥰");
  };

  // --- Handled Firebase Auth Operations ---
  const handleFirebaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!isFirebaseEnabled || !auth) {
      setAuthError("No active Firebase connection found. Working locally in secure Guest Mode.");
      return;
    }

    try {
      if (isSignUp) {
        // Create User Account via Firebase Auth SDK
        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const signedProfile: UserProfile = {
          uid: cred.user.uid,
          displayName: authNickname || "User",
          email: authEmail,
          avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`,
          createdAt: new Date().toISOString(),
          isGuest: false,
          nickname: authNickname
        };
        saveUserProfile(signedProfile);
        setProfile(signedProfile);
        setAuthSuccess("Account created successfully in Firebase Auth! 🎉");
        setShowAuthForm(false);
        triggerRefresh();
      } else {
        // Sign In Existing Credentials
        const cred = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        const signedProfile: UserProfile = {
          uid: cred.user.uid,
          displayName: cred.user.displayName || "User",
          email: authEmail,
          avatarUrl: cred.user.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`,
          createdAt: new Date().toISOString(),
          isGuest: false,
          nickname: cred.user.displayName || "User"
        };
        saveUserProfile(signedProfile);
        setProfile(signedProfile);
        setAuthSuccess("Signed in successfully with Firebase Auth! 👋");
        setShowAuthForm(false);
        triggerRefresh();
      }
    } catch (err: any) {
      setAuthError(err?.message || "Firebase Auth operation rejected. Check credentials.");
    }
  };

  // Firebase Google Auth Sign In
  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthSuccess("");

    if (!isFirebaseEnabled || !auth) {
      setAuthError("Firebase is not connected in the backend environment. Working in locale.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const signedProfile: UserProfile = {
        uid: result.user.uid,
        displayName: result.user.displayName || "User",
        email: result.user.email || "",
        avatarUrl: result.user.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`,
        createdAt: new Date().toISOString(),
        isGuest: false,
        nickname: result.user.displayName || "User"
      };
      saveUserProfile(signedProfile);
      setProfile(signedProfile);
      setAuthSuccess("Signed in successfully via Google Authentication! 🌈");
      setShowAuthForm(false);
      triggerRefresh();
    } catch (err: any) {
      setAuthError(err?.message || "Google Sign In popup cancelled or rejected.");
    }
  };

  // Sign out user session
  const handleSignOutUser = async () => {
    if (isFirebaseEnabled && auth) {
      await signOut(auth);
    }
    const defaultProfile: UserProfile = {
      uid: "guest_" + Math.random().toString(36).substring(2, 9),
      displayName: "Guest User",
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`,
      createdAt: new Date().toISOString(),
      isGuest: true
    };
    saveUserProfile(defaultProfile);
    setProfile(defaultProfile);
    triggerRefresh();
    alert("Signed out successfully. Resetting to secure Guest Mode session. 👋");
  };

  // Verify passcode for admin section access
  const handleVerifyAdminPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    if (adminPasscodeInput === "1234" || adminPasscodeInput.toLowerCase() === "admin") {
      setIsAdminAuthenticated(true);
      setAdminPasscodeInput("");
    } else {
      setAdminError("Invalid authorization passcode string. Please access again.");
    }
  };

  // Admin handler: Add / Save companion persona profile
  const handleSavePersonaAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBengaliName) {
      alert("Missing required card name fields.");
      return;
    }

    const uniqueId = newId.trim().toLowerCase() || newName.trim().toLowerCase().replace(/\s+/g, "_");
    const customPersona: Persona = {
      id: uniqueId,
      name: newName,
      bengaliName: newBengaliName,
      age: Number(newAge),
      avatar: newAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      bio: newBio || "A beautiful sweet companion AI profile.",
      status: "Online",
      personality: newPersonality || "Friendly, modern young girl.",
      prompt: newPrompt || "Be extremely sweet, friendly, and speak English-Bengali mix.",
      location: newLocation || "Dhaka, Bangladesh",
      zodiac: newZodiac || "Pisces ♓",
      hobbies: newHobbies ? newHobbies.split(",").map(s => s.trim()) : ["Listening to music"]
    };

    const updated = savePersona(customPersona);
    setAdminPersonas(updated);
    
    // Reset forms
    setNewId(""); setNewName(""); setNewBengaliName(""); setNewAvatar("");
    setNewBio(""); setNewPersonality(""); setNewPrompt(""); setNewLocation("Dhaka");
    setNewHobbies("");

    alert(`Female profile "${newName}" successfully created/updated in system directory! 🎉`);
    triggerRefresh();
  };

  // Admin handler: Delete companion persona
  const handleDeletePersonaAdmin = (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete "${name}"'s female profile?`)) {
      const remaining = deletePersona(id);
      setAdminPersonas(remaining);
      triggerRefresh();
    }
  };

  // Admin handler: Delete stories
  const handleDeleteStoryAdmin = (id: string) => {
    if (window.confirm("Delete this story panel?")) {
      const remaining = deleteStory(id);
      setAdminStories(remaining);
      triggerRefresh();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0C0E]" id="settings_tab_view">
      
      {/* Settings Tab header */}
      <div className="px-4 pt-4 pb-2 select-none flex-shrink-0">
        <h1 className="text-2xl font-black text-gray-100 flex items-center space-x-2 tracking-tight">
          <span>Menu</span>
          <span className="text-blue-500 font-mono text-xs bg-blue-500/10 px-2 py-0.5 rounded-full mt-0.5">Settings & Controls</span>
        </h1>
      </div>

      {/* Main Settings Panel options */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 pb-20 select-none" id="settings_options_scroller">
        
        {/* User Card info block */}
        <div className="bg-[#18191A] p-4 rounded-2xl border border-gray-800/40 flex items-center space-x-4 relative">
          <div className="relative">
            <img 
              src={profile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"} 
              alt={profile.displayName} 
              className="w-14 h-14 rounded-full object-cover border-2 border-[#0084FF]/60"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border border-[#18191A] flex items-center justify-center text-[8px] font-mono">
              ★
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-100 truncate flex items-center space-x-1.5 leading-none">
              <span>{profile.nickname || profile.displayName}</span>
              <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                profile.isGuest ? "bg-amber-950/40 text-amber-300 border border-amber-900/10" : "bg-green-950/40 text-green-300 border border-green-900/10"
              }`}>
                {profile.isGuest ? "Guest Mode" : "User Verified"}
              </span>
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-1 w-full truncate">UID: {profile.uid}</p>
            {profile.email && <p className="text-[10px] text-gray-400 font-sans mt-0.5 truncate">{profile.email}</p>}
          </div>

          {/* User Signout Button */}
          {!profile.isGuest && (
            <button 
              onClick={handleSignOutUser}
              className="p-1 px-2.5 bg-red-950/30 text-red-400 font-bold border border-red-900/10 hover:bg-red-900 hover:text-white rounded-full text-[10px] flex items-center space-x-1 font-sans transition duration-150 absolute top-4 right-4"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          )}
        </div>

        {/* Change Nickname Section Form */}
        <div className="bg-[#18191A] p-4 rounded-2xl border border-gray-800/40 space-y-3">
          <span className="text-gray-500 block uppercase font-mono tracking-wider text-[10px]">
            Nickname (মেয়েরা যেভাবে ডাকবে!)
          </span>
          <form onSubmit={handleUpdateNickname} className="flex space-x-2">
            <input 
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="e.g. Nabil or Sujon..."
              className="bg-[#242526] text-xs px-3 py-2 rounded-xl focus:outline-none flex-1 font-sans text-gray-100 border border-gray-800"
              required
            />
            <button 
              type="submit"
              className="bg-[#0084FF] hover:bg-blue-600 text-[11px] px-4 rounded-xl font-semibold flex items-center space-x-1 border border-transparent transition focus:outline-none"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </form>
        </div>

        {/* Guest Mode with optional sign-up prompt */}
        {profile.isGuest && (
          <div className="bg-gradient-to-r from-blue-950/20 to-purple-950/20 p-4 rounded-2xl border border-blue-900/20 space-y-3 text-center">
            <p className="text-xs text-blue-300 leading-relaxed font-sans">
              🌟 You are presently in **Guest Mode**. Your chat lists, unread parameters, and custom companions save on your browser. Register with Firebase now for cloud syncing!
            </p>
            <button 
              onClick={() => setShowAuthForm(true)}
              className="bg-[#0084FF] hover:bg-blue-600 px-4 py-2 rounded-full text-xs font-bold font-sans tracking-wide inline-flex items-center space-x-1.5 focus:outline-none"
              id="get_started_auth_btn"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect Firebase Sync</span>
            </button>
          </div>
        )}

        {/* Firebase Account Sign In Overlay Form Panel */}
        {showAuthForm && (
          <div className="bg-[#18191A] p-5 rounded-2xl border border-gray-800 relative space-y-4">
            <button 
              onClick={() => setShowAuthForm(false)}
              className="absolute top-4 right-4 text-xs text-gray-400 hover:text-white"
            >
              ✕ Close
            </button>

            <h3 className="font-bold text-sm tracking-wide text-gray-100 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#0084FF]" />
              <span>{isSignUp ? "Create Verified Account" : "Access Registered Account"}</span>
            </h3>

            <form onSubmit={handleFirebaseAuth} className="space-y-3 text-xs flex flex-col">
              
              {isSignUp && (
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-tight block mb-1">Nickname (মেয়েরা যেভাবে ডাকবে!)</label>
                  <input 
                    type="text"
                    value={authNickname}
                    onChange={(e) => setAuthNickname(e.target.value)}
                    placeholder="Enter nickname, e.g., Nabil"
                    className="w-full bg-[#242526] p-2.5 rounded-xl text-gray-200 border border-gray-800 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-tight block mb-1">Email Address</label>
                <input 
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. nabil780294@gmail.com"
                  className="w-full bg-[#242526] p-2.5 rounded-xl text-gray-200 border border-gray-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-tight block mb-1">Password</label>
                <input 
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password (minimum 6 characters)"
                  className="w-full bg-[#242526] p-2.5 rounded-xl text-gray-200 border border-gray-800 focus:outline-none"
                  minLength={6}
                  required
                />
              </div>

              {authError && <p className="text-[11px] text-red-500 bg-red-950/20 p-2 rounded border border-red-900/20 font-sans">{authError}</p>}
              {authSuccess && <p className="text-[11px] text-green-500 bg-green-950/20 p-2 rounded border border-green-900/20 font-sans">{authSuccess}</p>}

              <button 
                type="submit"
                className="w-full bg-[#0084FF] hover:bg-blue-600 text-xs py-2.5 rounded-full font-bold mt-2 cursor-pointer text-center"
              >
                {isSignUp ? "অ্যাকাউন্ট তৈরি করুন ➔" : "লগইন করুন ➔"}
              </button>
            </form>

            <div className="text-center text-gray-500 font-mono text-[9px] uppercase tracking-widest my-2">
              বা (Or Connect)
            </div>

            {/* Google Authentication button */}
            <button 
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold font-sans text-xs py-2 rounded-full flex items-center justify-center space-x-2 border border-gray-200 active:scale-95 transition"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-4 h-4" />
              <span>গুগল দিয়ে লগইন (Google Auth)</span>
            </button>

            <div className="pt-2 text-center text-xs">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#0084FF] font-medium hover:underline text-xs"
              >
                {isSignUp ? "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন" : "নতুন সদস্য? অ্যাকাউন্ট তৈরি করুন"}
              </button>
            </div>
          </div>
        )}

        {/* Administration Dashboard security gate toggler */}
        <div className="bg-[#18191A] p-4 rounded-2xl border border-gray-800/40 space-y-4">
          <div className="flex items-center justify-between select-none">
            <span className="text-gray-500 block uppercase font-mono tracking-wider text-[10px]">
              Admin Panel Access
            </span>
            <button 
              onClick={() => setShowAdminPortal(!showAdminPortal)}
              className="text-[#0084FF] text-xs hover:underline cursor-pointer"
            >
              {showAdminPortal ? "Minimize Panel" : "Login Guard"}
            </button>
          </div>

          {showAdminPortal && !isAdminAuthenticated && (
            <form onSubmit={handleVerifyAdminPasscode} className="space-y-2 text-xs">
              <p className="text-gray-500 text-[11px]">Enter Admin passphrase to unlocked system database: (Hint: passcode is **1234**)</p>
              <div className="flex space-x-2">
                <input 
                  type="password"
                  value={adminPasscodeInput}
                  onChange={(e) => setAdminPasscodeInput(e.target.value)}
                  placeholder="Enter passcode..."
                  className="bg-[#242526] text-xs px-3 py-2 rounded-xl focus:outline-none flex-1 text-gray-100 border border-gray-800"
                />
                <button type="submit" className="bg-[#0084FF] hover:bg-blue-600 px-4 rounded-xl text-xs font-semibold">
                  Unlock
                </button>
              </div>
              {adminError && <p className="text-[11px] text-red-500 font-sans">{adminError}</p>}
            </form>
          )}

          {/* Unlocked Administrator Console */}
          {showAdminPortal && isAdminAuthenticated && (
            <div className="space-y-6 pt-2 animate-fade-in text-xs" id="admin_control_dash">
              
              {/* Profile setup header */}
              <div className="bg-purple-950/20 p-3.5 rounded-xl border border-purple-900/30 flex justify-between items-center text-purple-300">
                <div className="flex space-x-1.5 items-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-bold tracking-wide">Admin Directory Active</span>
                </div>
                <button 
                  onClick={() => setIsAdminAuthenticated(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Lock
                </button>
              </div>

              {/* SECTION: Create / Edit Personas profiles */}
              <div className="space-y-3.5 border-t border-gray-800/60 pt-4">
                <h4 className="font-bold text-gray-100 flex items-center space-x-1 text-sm tracking-wide">
                  <Users className="w-4 h-4 text-[#0084FF]" />
                  <span>{editingPersona ? `Edit Profile: ${editingPersona.name}` : "Create/Edit AI Companions"}</span>
                </h4>

                <form onSubmit={handleSavePersonaAdmin} className="space-y-3">
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Profile UID ID</label>
                      <input 
                        type="text"
                        value={newId}
                        onChange={(e) => setNewId(e.target.value)}
                        placeholder="e.g. jannat (lowercase)"
                        className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Zodiac Astrological</label>
                      <input 
                        type="text"
                        value={newZodiac}
                        onChange={(e) => setNewZodiac(e.target.value)}
                        placeholder="e.g. Leo ♌"
                        className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Companion Name</label>
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Jannat"
                        className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Bengali Native Name</label>
                      <input 
                        type="text"
                        value={newBengaliName}
                        onChange={(e) => setNewBengaliName(e.target.value)}
                        placeholder="e.g. জান্নাত"
                        className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Age Year</label>
                      <input 
                        type="number"
                        value={newAge}
                        onChange={(e) => setNewAge(Number(e.target.value))}
                        className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1">Dhaka / Location Area</label>
                      <input 
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g. Banani, Dhaka"
                        className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Avatar picture URL</label>
                    <input 
                      type="url"
                      value={newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                      placeholder="High fidelity photo HTTPS URL string"
                      className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1 font-mono">Personal Bio Profile Summary</label>
                    <textarea 
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="Introduce companion bio. Sweet details, age background, student details..."
                      className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full h-16 resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1 font-mono">Short Personality Tone</label>
                    <input 
                      type="text"
                      value={newPersonality}
                      onChange={(e) => setNewPersonality(e.target.value)}
                      placeholder="e.g. Sassy, extroverted fashion enthusiast"
                      className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1 font-mono">Gemini AI Prompt Instructions (System instructions)</label>
                    <textarea 
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="Special instructions detailing how she should address user and specific flirty Bengali mixed prompt cues..."
                      className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full h-16 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1 font-mono">Hobbies comma separated</label>
                    <input 
                      type="text"
                      value={newHobbies}
                      onChange={(e) => setNewHobbies(e.target.value)}
                      placeholder="Reading poems, Rain watching, Cooking"
                      className="bg-[#242526] p-2 rounded-lg text-gray-200 border border-gray-800 w-full"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#0084FF] hover:bg-blue-600 py-2 rounded-xl text-center font-bold font-sans flex items-center justify-center space-x-1.5 focus:outline-none"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{editingPersona ? "Update Companion Profile" : "Create Female Profile"}</span>
                  </button>

                  {editingPersona && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingPersona(null);
                        setNewId(""); setNewName(""); setNewBengaliName(""); setNewAvatar("");
                        setNewBio(""); setNewPersonality(""); setNewPrompt(""); setNewLocation("Dhaka");
                        setNewHobbies("");
                      }}
                      className="w-full bg-gray-800 hover:bg-gray-700 py-1.5 rounded-xl font-sans mt-1"
                    >
                      Clear Edit Selection
                    </button>
                  )}
                </form>

                {/* Directory list for deletions / editing overrides */}
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto border border-gray-800 p-2.5 rounded-lg bg-gray-950/30">
                  <span className="text-[9px] uppercase font-mono text-gray-500 tracking-wider">Directory Registry</span>
                  {adminPersonas.map(persona => (
                    <div key={persona.id} className="flex items-center justify-between p-1.5 hover:bg-gray-800/40 rounded flex-wrap">
                      <div className="flex items-center space-x-2">
                        <img src={persona.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="font-semibold text-gray-200 text-xs">{persona.name} ({persona.bengaliName})</span>
                      </div>

                      <div className="flex space-x-1.5 mt-1 sm:mt-0">
                        <button 
                          onClick={() => {
                            setEditingPersona(persona);
                            setNewId(persona.id);
                            setNewName(persona.name);
                            setNewBengaliName(persona.bengaliName);
                            setNewAge(persona.age);
                            setNewAvatar(persona.avatar);
                            setNewBio(persona.bio);
                            setNewPersonality(persona.personality);
                            setNewPrompt(persona.prompt);
                            setNewLocation(persona.location);
                            setNewZodiac(persona.zodiac);
                            setNewHobbies(persona.hobbies.join(", "));
                          }}
                          className="p-1 text-blue-400 hover:bg-gray-800 rounded"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePersonaAdmin(persona.id, persona.name)}
                          className="p-1 text-red-500 hover:bg-gray-800 rounded"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: Manage Stories */}
              <div className="space-y-3.5 border-t border-gray-800/60 pt-4">
                <h4 className="font-bold text-gray-100 flex items-center space-x-1 text-sm tracking-wide">
                  <Image className="w-4 h-4 text-purple-400" />
                  <span>Manage User Stories</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-800 p-2.5 rounded-lg bg-gray-950/30">
                  {adminStories.map(story => (
                    <div key={story.id} className="flex items-center justify-between p-1.5 hover:bg-gray-800/40 rounded">
                      <div className="flex items-center space-x-2">
                        <img src={story.mediaUrl} alt="" className="w-6 h-6 rounded object-cover" />
                        <span className="text-xs text-gray-300 truncate max-w-[120px]">{story.text} (by {story.name})</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteStoryAdmin(story.id)}
                        className="p-1 text-red-500 hover:bg-gray-850 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Dynamic Mobile Direct Installer Block */}
        <div className="bg-gradient-to-r from-[#18191A] to-[#1F111E] p-4 rounded-2xl border border-gray-800/40 space-y-3.5" id="settings_download_apk_section">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#0084FF]/10 rounded-xl border border-[#0084FF]/25 text-[#0084FF] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0084FF]" />
            </div>
            <div>
              <span className="text-gray-100 block font-bold text-xs">মায়া অফিশিয়াল অ্যান্ড্রয়েড অ্যাপ</span>
              <span className="text-[9.5px] text-gray-400 mt-0.5 block">Android ফোনে সরাসরি ১-ক্লিক ইনস্টল করুন</span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onDownloadAPK}
            className="w-full bg-[#0084FF] hover:bg-[#0084FF]/90 font-semibold text-white text-xs py-2.5 rounded-xl text-center flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition"
            id="settings_apk_download_trigger"
          >
            <Download className="w-4 h-4 text-white animate-bounce" />
            <span>১-ক্লিকে অ্যাপ ডাউনলোড করুন (৪.৮ MB)</span>
          </button>
        </div>

        {/* Clean Chats Log section */}
        <div className="bg-[#18191A] p-4 rounded-2xl border border-gray-800/40 space-y-4">
          <span className="text-gray-500 block uppercase font-mono tracking-wider text-[10px]">
            Privacy & Performance
          </span>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to completely erase all chat histories from this session? This action is local and irreversible.")) {
                onClearChats();
              }
            }}
            className="w-full bg-red-950/10 hover:bg-red-900 border border-red-900/10 hover:border-transparent text-red-400 hover:text-white text-xs py-2 rounded-xl text-center tracking-wide font-sans transition duration-150 focus:outline-none"
            id="clear_chats_danger_btn"
          >
            Clear All Conversations
          </button>
        </div>

      </div>

    </div>
  );
}
