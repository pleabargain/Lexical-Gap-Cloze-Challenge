import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameData, CEFRLevel } from "../types";

export const generateTopics = async (temperature: number): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topics: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of 6 distinct, engaging, and specific topics for a newspaper-style article."
      }
    },
    required: ["topics"]
  };

  const prompt = "Generate 6 diverse, interesting, and specific topics for a language learning reading exercise (e.g., 'The Future of Urban Farming', 'Minimalist Architecture', 'Coffee Culture in Vienna'). Avoid generic one-word topics.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: temperature,
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    return data.topics || [];
  } catch (error) {
    console.error("Gemini API Error (Topics):", error);
    return [];
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Translate the following text into ${targetLanguage}. Maintain the tone and style of the original. Return only the translated text.\n\nText: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Translation Error:", error);
    return "";
  }
};

export const generateGameContent = async (
  topic: string,
  level: CEFRLevel,
  language: string,
  temperature: number = 0.7
): Promise<GameData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy headline for the text in the target language." },
      content: { 
        type: Type.STRING, 
        description: "The article text (2-3 paragraphs) in the target language. Replace 6-8 distinct collocations, idioms, or phrasal verbs with placeholders in the format {{1}}, {{2}}, etc. Do not include the answer in the text, only the placeholder." 
      },
      englishTranslation: {
        type: Type.STRING,
        description: "A complete natural translation of the full article (with the blanks filled in correctly) into English."
      },
      blanks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER, description: "The ID matching the placeholder in content (e.g., 1)." },
            correctAnswer: { type: Type.STRING, description: "The correct collocation/idiom in the target language." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 4 options in the target language: the correct answer and 3 plausible but incorrect distractors. They must be shuffled." 
            },
            explanation: { type: Type.STRING, description: "A brief explanation of why this lexical unit is correct in this context. Write this explanation in English." }
          },
          required: ["id", "correctAnswer", "options", "explanation"]
        }
      }
    },
    required: ["title", "content", "englishTranslation", "blanks"]
  };

  const prompt = `
    Create a "Fill in the Blanks" language exercise for a student learning ${language}.
    
    Topic: ${topic || "General Interest (Science, Culture, or News)"}
    Target CEFR Level: ${level}
    Target Language: ${language}
    
    Instructions:
    1. Write a cohesive, high-quality, newspaper-style text of about 150-200 words in ${language} suitable for the requested CEFR level.
    2. Identify 6-8 natural lexical chunks (collocations, phrasal verbs, idioms) appropriate for this level in ${language}.
    3. Replace these chunks in the text with placeholders {{1}}, {{2}}, etc.
    4. Provide the correct answer and 3 distractors for each blank in ${language}. Distractors should be grammatically plausible but semantically or collocationally incorrect.
    5. IMPORTANT: Write the 'explanation' for each blank in English, so the learner can understand the reasoning.
    6. Provide a full English translation of the original text (as if no blanks existed).
    
    Ensure the text flows naturally.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: temperature, 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as GameData;
    
    // Safety check: Ensure content has placeholders
    if (!data.content.includes("{{")) {
      throw new Error("Generated text missing placeholders.");
    }

    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
