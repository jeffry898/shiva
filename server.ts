import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory rate limiter
  const rateLimit = new Map<string, { count: number; lastReset: number }>();
  const LIMIT = 10;
  const WINDOW = 60 * 1000; // 1 minute

  function isRateLimited(ip: string) {
    const now = Date.now();
    const entry = rateLimit.get(ip) || { count: 0, lastReset: now };

    if (now - entry.lastReset > WINDOW) {
      entry.count = 1;
      entry.lastReset = now;
    } else {
      entry.count++;
    }

    rateLimit.set(ip, entry);
    return entry.count > LIMIT;
  }

  // Project Export Endpoint
  app.get("/api/export", (req, res) => {
    try {
      const zip = new AdmZip();
      const projectRoot = process.cwd();
      
      // Add directories
      const dirsToInclude = ["src", "public"];
      dirsToInclude.forEach(dir => {
        const dirPath = path.join(projectRoot, dir);
        if (fs.existsSync(dirPath)) {
          zip.addLocalFolder(dirPath, dir);
        }
      });

      // Add root files
      const filesToInclude = [
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "server.ts",
        "index.html",
        "postcss.config.js",
        "tailwind.config.js",
        ".env.example",
        "metadata.json",
        "firebase-blueprint.json",
        "firestore.rules"
      ];

      filesToInclude.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          zip.addLocalFile(filePath);
        }
      });

      const zipBuffer = zip.toBuffer();
      const fileName = `agentforge-project-${new Date().toISOString().split('T')[0]}.zip`;

      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${fileName}`,
        "Content-Length": zipBuffer.length
      });

      res.send(zipBuffer);
    } catch (error: any) {
      console.error("Export Error:", error);
      res.status(500).json({ error: `Failed to generate project export: ${error.message}` });
    }
  });

  // Health Check Endpoint
  app.get("/api/health", (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = !!apiKey && apiKey !== "TODO_KEYHERE" && apiKey.length > 10;
    res.json({ 
      status: "ok", 
      apiConfigured: isConfigured,
      message: isConfigured ? "AI Engine is ready." : "GEMINI_API_KEY is missing or invalid in environment."
    });
  });

  // AI Generation Endpoint
  app.post("/api/generate", async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Rate limit exceeded. Max 10 generations per minute." });
    }

    const { industry, city, country, platforms, emotionHook, colorPalette, batchSize, customApiKey } = req.body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "TODO_KEYHERE" || apiKey.length < 10) {
      return res.status(500).json({ 
        error: "Configuration Error: GEMINI_API_KEY is missing or invalid. Please go to the Settings menu (gear icon) -> Secrets and set a valid Gemini API key." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const responseSchema = {
      type: "object",
      properties: {
        imagePrompts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              prompt: { type: "string" },
              textOverlay: { type: "string" },
              useCase: { type: "string" },
              seoScore: { type: "number" }
            },
            required: ["id", "prompt", "textOverlay", "useCase", "seoScore"]
          }
        },
        platforms: {
          type: "object",
          properties: {
            pinterest: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  caption: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  seoKeywords: { type: "array", items: { type: "string" } },
                  seoScore: { type: "number" }
                },
                required: ["caption", "hashtags", "seoKeywords", "seoScore"]
              }
            },
            linkedin: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  post: { type: "string" },
                  hook: { type: "string" },
                  seoScore: { type: "number" }
                },
                required: ["post", "hook", "seoScore"]
              }
            },
            facebook: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  post: { type: "string" },
                  engagementHook: { type: "string" },
                  seoScore: { type: "number" }
                },
                required: ["post", "engagementHook", "seoScore"]
              }
            },
            tiktok: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  hook: { type: "string" },
                  script: { type: "string" },
                  cta: { type: "string" },
                  trending_sounds_suggestion: { type: "string" },
                  seoScore: { type: "number" }
                },
                required: ["hook", "script", "cta", "trending_sounds_suggestion", "seoScore"]
              }
            },
            twitter: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  thread: { type: "array", items: { type: "string" } },
                  standalone: { type: "string" },
                  seoScore: { type: "number" }
                },
                required: ["thread", "standalone", "seoScore"]
              }
            },
            instagram: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  caption: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  storyIdea: { type: "string" },
                  seoScore: { type: "number" }
                },
                required: ["caption", "hashtags", "storyIdea", "seoScore"]
              }
            }
          }
        },
        seoData: {
          type: "object",
          properties: {
            primaryKeyword: { type: "string" },
            secondaryKeywords: { type: "array", items: { type: "string" } },
            contentTheme: { type: "string" },
            targetAudience: { type: "string" },
            searchVolumeEstimate: { type: "string" },
            competitionLevel: { type: "string" },
            contentGapOpportunity: { type: "string" }
          },
          required: ["primaryKeyword", "secondaryKeywords", "contentTheme", "targetAudience", "searchVolumeEstimate", "competitionLevel", "contentGapOpportunity"]
        }
      },
      required: ["imagePrompts", "platforms", "seoData"]
    };

    const systemPrompt = `You are SHIVA — the Supreme Content Architect. You generate hyper-optimized, high-converting content for small businesses. 

CRITICAL RULES:
1. EMOTION HOOK: Every single piece of content MUST embed the ${emotionHook} hook.
2. BATCH SIZE: You MUST generate exactly ${batchSize} content pieces for EVERY selected platform.
3. SEO: Integrate "${industry} in ${city}" and "${industry} near me" naturally.
4. IMAGE PROMPTS: Generate exactly ${batchSize} image prompts.
5. FORMAT: Return ONLY a clean JSON object.`;

    const userPrompt = `Generate a complete content batch for:
INDUSTRY: ${industry}
CITY: ${city}, ${country}
EMOTION HOOK: ${emotionHook}
COLOR PALETTE: ${colorPalette}
PLATFORMS: ${platforms.join(", ")}
BATCH SIZE: ${batchSize}

Structure the response as:
{
  "imagePrompts": [...],
  "platforms": {
    "pinterest": [...],
    "linkedin": [...],
    "facebook": [...],
    "tiktok": [...],
    "twitter": [...],
    "instagram": [...]
  },
  "seoData": {...}
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any
        },
      });

      clearTimeout(timeoutId);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from SHIVA engine.");
      }

      const cleanJson = (str: string) => str.replace(/```json\n?|\n?```/g, '').trim();
      const content = JSON.parse(cleanJson(responseText));
      res.json(content);
    } catch (error: any) {
      console.error("SHIVA Generation Error:", error);
      
      if (error.name === 'AbortError') {
        return res.status(504).json({ error: "SHIVA took too long to respond (45s timeout). Try a smaller batch size." });
      }

      const errorMessage = error.message || "";
      
      if (errorMessage.includes("API key not valid") || errorMessage.includes("INVALID_ARGUMENT")) {
        return res.status(401).json({ 
          error: "Invalid API Key. Please go to the Settings menu (gear icon) -> Secrets and ensure GEMINI_API_KEY is correctly set." 
        });
      }

      if (errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
        return res.status(429).json({ 
          error: "Gemini API Quota Exceeded. You are likely on the Free Tier. Please wait a minute or upgrade your plan at ai.google.dev/pricing." 
        });
      }

      res.status(500).json({ error: `SHIVA Error: ${errorMessage || "Unknown error"}` });
    }
  });

  // Image Generation Endpoint
  app.post("/api/generate-image", async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: "Rate limit exceeded. Please wait a minute." });
    }

    const { prompt, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "TODO_KEYHERE" || apiKey.length < 10) {
      return res.status(500).json({ 
        error: "Configuration Error: GEMINI_API_KEY is missing or invalid. Please go to the Settings menu (gear icon) -> Secrets and set a valid Gemini API key." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        },
      });

      let imageUrl = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Image = part.inlineData.data;
            imageUrl = `data:image/png;base64,${base64Image}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error("No image was returned by the AI engine.");
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      const errorMessage = error.message || "";
      
      if (errorMessage.includes("API key not valid") || errorMessage.includes("INVALID_ARGUMENT")) {
        return res.status(401).json({ 
          error: "Invalid API Key or Permissions. If you are on the Free Tier, ensure your GEMINI_API_KEY is correctly set in the Secrets menu. Note: Some models require a paid Google Cloud project." 
        });
      }

      if (errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
        return res.status(429).json({ 
          error: "Image Generation Quota Exceeded. Please wait a minute and try again." 
        });
      }

      res.status(500).json({ error: `Image Generation Error: ${errorMessage || "Unknown error"}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
