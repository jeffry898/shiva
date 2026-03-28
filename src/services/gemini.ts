import { GoogleGenAI, Type } from "@google/genai";

export const responseSchema = {
  type: Type.OBJECT,
  properties: {
    imagePrompts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          prompt: { type: Type.STRING },
          textOverlay: { type: Type.STRING },
          useCase: { type: Type.STRING },
          seoScore: { type: Type.NUMBER }
        },
        required: ["id", "prompt", "textOverlay", "useCase", "seoScore"]
      }
    },
    platforms: {
      type: Type.OBJECT,
      properties: {
        pinterest: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              seoScore: { type: Type.NUMBER }
            },
            required: ["caption", "hashtags", "seoKeywords", "seoScore"]
          }
        },
        linkedin: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              post: { type: Type.STRING },
              hook: { type: Type.STRING },
              seoScore: { type: Type.NUMBER }
            },
            required: ["post", "hook", "seoScore"]
          }
        },
        facebook: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              post: { type: Type.STRING },
              engagementHook: { type: Type.STRING },
              seoScore: { type: Type.NUMBER }
            },
            required: ["post", "engagementHook", "seoScore"]
          }
        },
        tiktok: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              script: { type: Type.STRING },
              cta: { type: Type.STRING },
              trending_sounds_suggestion: { type: Type.STRING },
              seoScore: { type: Type.NUMBER }
            },
            required: ["hook", "script", "cta", "trending_sounds_suggestion", "seoScore"]
          }
        },
        twitter: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              thread: { type: Type.ARRAY, items: { type: Type.STRING } },
              standalone: { type: Type.STRING },
              seoScore: { type: Type.NUMBER }
            },
            required: ["thread", "standalone", "seoScore"]
          }
        },
        instagram: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              storyIdea: { type: Type.STRING },
              seoScore: { type: Type.NUMBER }
            },
            required: ["caption", "hashtags", "storyIdea", "seoScore"]
          }
        }
      }
    },
    seoData: {
      type: Type.OBJECT,
      properties: {
        primaryKeyword: { type: Type.STRING },
        secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        contentTheme: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        searchVolumeEstimate: { type: Type.STRING },
        competitionLevel: { type: Type.STRING },
        contentGapOpportunity: { type: Type.STRING }
      },
      required: ["primaryKeyword", "secondaryKeywords", "contentTheme", "targetAudience", "searchVolumeEstimate", "competitionLevel", "contentGapOpportunity"]
    }
  },
  required: ["imagePrompts", "platforms", "seoData"]
};

export async function generateContentWithGemini(data: any, apiKey: string) {
  const { industry, city, country, platforms, emotionHook, colorPalette, batchSize } = data;
  
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are a world-class digital marketing strategist and SEO architect specializing in AI automation for small businesses. You create content that ranks on Google, converts on social media, and makes business owners feel they MUST take action NOW. 

CRITICAL SEO RULES:
1. IMAGE PROMPTS: Every prompt MUST naturally integrate the city name and industry as descriptive keywords (e.g., "A modern [industry] office in the heart of [city]...").
2. PINTEREST: The primary keyword "${industry} in ${city}" MUST appear within the first 50 characters of every caption.
3. NEAR ME: Automatically integrate "${industry} near me" or "${city} ${industry} near me" into all Pinterest and Facebook content.
4. HASHTAGS: All hashtags MUST be lowercase, no spaces, and properly formatted (e.g., #best${industry.toLowerCase().replace(/\s+/g, '')}).
5. SEO SCORE: Assign an "seoScore" (1-100) to every piece of content based on keyword density, readability, and local relevance.
6. SEO DATA: Provide deep intelligence including search volume estimates, competition levels, and content gap opportunities.`;

  const userPrompt = `Generate a complete content batch for:
INDUSTRY: ${industry}
CITY: ${city}, ${country}
EMOTION HOOK: ${emotionHook}
COLOR PALETTE: ${colorPalette}
PLATFORMS: ${platforms.join(", ")}
BATCH SIZE: ${batchSize} (This applies to the number of IMAGE PROMPTS)

CRITICAL: For each platform in 'platforms', generate exactly 3 high-quality, high-converting posts. Do not exceed this to stay within token limits.

OUTPUT FORMAT (JSON):
{
  "imagePrompts": [
    {
      "id": 1,
      "prompt": "[Detailed prompt including '${industry}' and '${city}' as natural keywords. Style: ${colorPalette}]",
      "textOverlay": "[Emotion-hook headline]",
      "useCase": "[Platform]",
      "seoScore": [1-100]
    }
  ],
  "platforms": {
    "pinterest": [
      {
        "caption": "[MUST start with '${industry} in ${city}'. Include '${industry} near me'. 150-300 chars]",
        "hashtags": ["#lowercase", "#notags"],
        "seoKeywords": ["keyword1", "keyword2"],
        "seoScore": [1-100]
      }
    ],
    "linkedin": [
      {
        "post": "[Professional post. Hook + 3 points + CTA]",
        "hook": "[Scroll stopper]",
        "seoScore": [1-100]
      }
    ],
    "facebook": [
      {
        "post": "[Engagement post. Include '${industry} near me' naturally. Local ${city} reference]",
        "engagementHook": "[Opening line]",
        "seoScore": [1-100]
      }
    ],
    "tiktok": [
      {
        "hook": "[0-3s hook]",
        "script": "[30-60s script]",
        "cta": "[End CTA]",
        "trending_sounds_suggestion": "[Audio]",
        "seoScore": [1-100]
      }
    ],
    "twitter": [
      {
        "thread": ["Tweet 1", "Tweet 2", "Tweet 3"],
        "standalone": "[Single tweet]",
        "seoScore": [1-100]
      }
    ],
    "instagram": [
      {
        "caption": "[Storytelling format. 5 lowercase hashtags at end]",
        "hashtags": ["#lowercase"],
        "storyIdea": "[Concept]",
        "seoScore": [1-100]
      }
    ]
  },
  "seoData": {
    "primaryKeyword": "${industry} in ${city}",
    "secondaryKeywords": ["${industry} near me", "best ${industry} ${city}"],
    "contentTheme": "[Theme]",
    "targetAudience": "[Audience]",
    "searchVolumeEstimate": "[Estimated monthly searches for primary keyword]",
    "competitionLevel": "Low" | "Medium" | "High",
    "contentGapOpportunity": "[Specific niche angle currently underserved in ${city}]"
  }
}

IMPORTANT: Return ONLY the JSON object. The imageprompts array should have ${batchSize} items.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema as any
    }
  });

  return JSON.parse(response.text);
}
