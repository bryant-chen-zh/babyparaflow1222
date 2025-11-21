import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// NOTE: The API key is expected to be in process.env.API_KEY
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Step 1: Generate Document
 */
export const generateDocument = async (userIntent: string) => {
  const systemInstruction = `
    You are a Senior Product Manager. 
    Analyze the user's intent and create a structured Document (formerly PRD).
    Keep it concise but professional.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `User Intent: ${userIntent}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING, description: "A 2-sentence summary of the product." },
          features: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of 3-5 key features."
          },
          todos: {
             type: Type.ARRAY,
             items: { type: Type.STRING },
             description: "List of 3-5 high-level development tasks."
          }
        },
        required: ["overview", "features", "todos"]
      }
    }
  });

  return response.text ? JSON.parse(response.text) : null;
};

/**
 * Step 2: Generate User Flow
 */
export const generateUserFlow = async (userIntent: string, docOverview: string) => {
  const systemInstruction = `
    You are a UX Designer.
    Create a linear user flow for the described product.
    Focus on the "Happy Path".
    Limit to 4-5 steps max.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Product: ${userIntent}. Overview: ${docOverview}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING, description: "Short action name (e.g., 'Sign In')" },
                description: { type: Type.STRING, description: "What happens here." }
              },
              required: ["id", "label", "description"]
            }
          }
        }
      }
    }
  });

  return response.text ? JSON.parse(response.text) : null;
};

/**
 * Step 3: Generate Screen (Prototype)
 */
export const generateScreen = async (screenName: string, description: string, context: string) => {
  const systemInstruction = `
    You are a Senior Frontend Engineer and UI Designer.
    Generate the HTML structure for a mobile app screen: "${screenName}".
    
    RULES:
    1. Use ONLY standard HTML tags and Tailwind CSS classes.
    2. DO NOT use markdown code blocks. Return raw string.
    3. Design for a dark mode aesthetic (slate-900 bg).
    4. The output will be injected into a mobile-sized container.
    5. Make it look like a high-fidelity app (Instagram/Twitter quality).
    6. Use FontAwesome classes (e.g., "fas fa-home") for icons if needed, or simple text.
    7. Ensure contrast is accessible.
    
    Context: ${context}
    Description: ${description}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Create the visual code for screen: ${screenName}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          htmlContent: { type: Type.STRING, description: "The raw HTML string with Tailwind classes." },
          screenName: { type: Type.STRING }
        }
      }
    }
  });

  return response.text ? JSON.parse(response.text) : null;
};

/**
 * Step 4: Generate Database Schema
 */
export const generateDatabase = async (description: string) => {
    const systemInstruction = `
      You are a Senior Backend Engineer.
      Design a database schema for the described feature.
      Return a list of fields for a single key table.
    `;
  
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Feature Description: ${description}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tableName: { type: Type.STRING },
            fields: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, description: "SQL type (e.g. VARCHAR, INT)" },
                        constraints: { type: Type.STRING, description: "e.g. PK, NOT NULL" }
                    },
                    required: ["name", "type"]
                }
            }
          },
          required: ["tableName", "fields"]
        }
      }
    });
  
    return response.text ? JSON.parse(response.text) : null;
  };
