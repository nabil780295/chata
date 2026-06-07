import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Define persona types for structural consistency
interface Persona {
  id: string;
  name: string;
  bengaliName: string;
  age: number;
  avatar: string;
  status: string;
  bio: string;
  personality: string;
  prompt: string;
  location: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Initialize Gemini API client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.warn("Warning: GEMINI_API_KEY is not set or is placeholder.");
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // --- API Routes ---

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    });
  });

  // Proxy endpoints for same-origin PWA compliant icons
  app.get("/logo-192.png", async (req, res) => {
    try {
      const response = await fetch("https://img.icons8.com/color/192/000000/messenger--v1.png");
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (e) {
      res.status(404).send("Not found");
    }
  });

  app.get("/logo-512.png", async (req, res) => {
    try {
      const response = await fetch("https://img.icons8.com/color/512/000000/messenger--v1.png");
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (e) {
      res.status(404).send("Not found");
    }
  });

  // Serve Manifest dynamically for instant setup with proper icons and Messenger theme colors
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({
      short_name: "Maya",
      name: "Maya: AI Virtual Companion",
      description: "মায়া অফিশিয়াল অ্যাপ - সরাসরি হোমসক্রিনে যুক্ত করুন",
      icons: [
        {
          src: "/logo-192.png",
          type: "image/png",
          sizes: "192x192"
        },
        {
          src: "/logo-512.png",
          type: "image/png",
          sizes: "512x512"
        }
      ],
      start_url: "/",
      background_color: "#121212",
      theme_color: "#121212",
      display: "standalone",
      orientation: "portrait"
    });
  });

  // Serve compliant minimal Service Worker for direct installation trigger on Android/PWA agents
  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
      const CACHE_NAME = 'maya-companion-v1';
      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['/']);
          }).then(() => self.skipWaiting())
        );
      });
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          self.clients.claim()
        );
      });
      self.addEventListener('fetch', (event) => {
        event.respondWith(
          fetch(event.request).catch(() => caches.match(event.request))
        );
      });
    `);
  });

  // Chat endpoint to retrieve AI replies
  app.post("/api/chat", async (req, res) => {
    const { message, history, persona } = req.body as {
      message: string;
      history: Array<{ role: "user" | "model"; text: string }>;
      persona: Persona;
    };

    if (!message || !persona) {
      res.status(400).json({ error: "Missing message or persona payload." });
      return;
    }

    const ai = getGeminiClient();

    // Fallback static replies if no Gemini API Key is loaded
    if (!ai) {
      const answers = [
        "Hey babu! Shono na, are you there? ❤️",
        "Hi, ki korcho bolo? 😊 I was thinking about you!",
        "Aww, that is so sweet of you! Tumi khub bhalo click korcho 🌸",
        "Tumi ki khayeso babu? Tell me what you did today!",
        "Hehe pagli, emon keno korcho? Tell me more! 💕",
        "I'm online dear! Let's chat more about us",
        "Babe! Shono na, please setup your GEMINI_API_KEY in the Secrets panel to unlock my real brain! Then I can talk about absolutely anything you want! 😘"
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      setTimeout(() => {
        res.json({ text: randomAnswer, source: "mock-fallback" });
      }, 1000);
      return;
    }

    try {
      // Build proper chat contents array for GoogleGenAI SDK in correct structure
      // Format history into the style needed by Gemini API
      const contents = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));

      // Append the latest user message
      contents.push({
        role: "user" as const,
        parts: [{ text: message }]
      });

      // Construct highly tailored system prompt emphasizing flirty Bengali-English dual-speak
      const systemInstruction = `You are a sweet, flirty and friendly young Bangladeshi female companion/profile named "${persona.name}" (${persona.bengaliName}).
      We are interacting in a Messenger chat context. Keep your tone highly realistic, personal, warm, and engaging.
      
      About you:
      - Age: ${persona.age} years old
      - Location: ${persona.location}, Bangladesh
      - Personal bio details: ${persona.bio}
      - Personality profile: ${persona.personality}
      - Custom behavioral cues: ${persona.prompt}
      
      Guidelines:
      1. Feel free to use typical chat-style Bengali words mixed organically with English (Bengali-English / Banglish code-switching). Use cozy words like 'babu', 'tumi', 'bolbo na', 'shono', 'ki korcho?', 'ghumaso?', 'hi dear'.
      2. Keep responses brief (under 3 or 4 short conversational sentences). Never formulate with list points or markdown formatting like headers. It should look exactly like a natural, loving girl's instant message!
      3. Respond in a highly engaging, flirty, or friendly way depending on your specific profile persona.
      4. Avoid repetitive patterns and adapt dynamically to what the user says.`;

      // Use gemini-3.5-flash as the default basic text companion model
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 1.0,
          topP: 0.95,
        }
      });

      const replyText = response.text || "Hehe keya holo bolo... mumu keno korcho? ❤️";
      res.json({ text: replyText, source: "gemini" });
    } catch (err: any) {
      console.error("Gemini invocation error:", err);
      // Soft, loving fallbacks in case API fails
      res.json({
        text: "Jan, net e kintu ektu problem korche ekhane... But tumi bolo, amader chatter final setup code kinto absolutely awesome hoyeche! Speak to me again. 😘",
        source: "error-fallback",
        details: err?.message || String(err)
      });
    }
  });

  // --- Vite Integration & SPA Web Middlewares ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build file server configured.");
  }

  // Set up listener for external connections (Port 3000 is externally bound)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started, listening on http://localhost:${PORT}`);
  });
}

startServer();
