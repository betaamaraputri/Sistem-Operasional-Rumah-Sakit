import { GoogleGenAI, Type } from "@google/genai";
import { AgentType } from '../types';
import { AGENTS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The Router needs to be fast and strictly return an enum to decide the path
export const routeUserIntent = async (userMessage: string, history: string[]): Promise<AgentType> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // We use a simplified history for routing context
    const context = history.slice(-4).join("\n"); 

    const prompt = `
    ${AGENTS[AgentType.ORCHESTRATOR].systemInstruction}

    Analisis permintaan pengguna berikut dan konteks percakapan. 
    Tentukan agen mana yang harus menangani permintaan ini.
    
    Konteks:
    ${context}

    Permintaan Saat Ini:
    ${userMessage}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah logika perutean untuk AIS Rumah Sakit. Keluarkan hanya JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetAgent: {
              type: Type.STRING,
              enum: [
                AgentType.PATIENT_MANAGEMENT,
                AgentType.APPOINTMENT_SCHEDULING,
                AgentType.MEDICAL_RECORDS,
                AgentType.BILLING_INSURANCE,
                AgentType.ORCHESTRATOR 
              ],
              description: "Agen yang paling cocok untuk menangani permintaan. Gunakan ORCHESTRATOR jika ambigu."
            }
          },
          required: ["targetAgent"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json.targetAgent as AgentType || AgentType.ORCHESTRATOR;

  } catch (error) {
    console.error("Routing error:", error);
    // Fallback to Orchestrator in case of failure
    return AgentType.ORCHESTRATOR;
  }
};

export const generateAgentResponse = async (
  agentType: AgentType, 
  userMessage: string, 
  history: Array<{role: string, parts: Array<{text: string}>}> 
): Promise<string> => {
  
  const agent = AGENTS[agentType];
  
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history, // Pass full chat history so sub-agents have context
      config: {
        systemInstruction: agent.systemInstruction,
      }
    });

    const result = await chat.sendMessage({
      message: userMessage
    });

    return result.text || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

  } catch (error) {
    console.error(`Generation error for ${agent.name}:`, error);
    return "Terjadi kesalahan sistem saat menghubungi agen spesialis.";
  }
};