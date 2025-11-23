import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordData, StudyMode } from "../types";
import { playPCMAudio } from "./audio";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip Markdown code blocks
const cleanJSON = (text: string) => {
  if (!text) return "";
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return clean;
};

// --- CONTENT GENERATION ---

export const generateVocabularyList = async (
  topic: string,
  level: string,
  count: number,
  mode: StudyMode
): Promise<WordData[]> => {
  
  let prompt = `Bạn là chuyên gia ngôn ngữ AI. Hãy tạo danh sách JSON gồm ${count} từ vựng tiếng Anh về chủ đề '${topic}' ở trình độ '${level}'.`;
  
  if (mode === StudyMode.SYNONYMS) {
    prompt += " CHẾ ĐỘ TỪ ĐỒNG NGHĨA: Với mỗi mục, cung cấp từ gốc (word) và 1 từ đồng nghĩa chính xác (relatedTerm). Cung cấp nghĩa tiếng Việt của relatedTerm trong trường 'relatedMeaning'.";
  } else if (mode === StudyMode.ANTONYMS) {
    prompt += " CHẾ ĐỘ TỪ TRÁI NGHĨA: Với mỗi mục, cung cấp từ gốc (word) và 1 từ trái nghĩa chính xác (relatedTerm). Cung cấp nghĩa tiếng Việt của relatedTerm trong trường 'relatedMeaning'.";
  } else if (mode === StudyMode.PHRASAL_VERBS) {
    prompt += " CHẾ ĐỘ CỤM ĐỘNG TỪ: Các từ (word) bắt buộc phải là phrasal verbs.";
  }

  prompt += `
    YÊU CẦU CẤU TRÚC JSON NGHIÊM NGẶT:
    1. 'id': string (unique).
    2. 'word': string (Từ vựng chính).
    3. 'meaning': string (Nghĩa tiếng Việt ngắn gọn của 'word').
    4. 'pos': string (Từ loại: Noun, Verb, Adj...).
    5. 'phonetic': string (Phiên âm IPA).
    6. 'exampleEn': string (Câu ví dụ chứa 'word').
    7. 'exampleVn': string (Dịch câu ví dụ trên).
    8. 'relatedTerm': string (Bắt buộc nếu là Đồng nghĩa/Trái nghĩa, nếu không thì null).
    9. 'relatedMeaning': string (Nghĩa tiếng Việt của relatedTerm).
    10. 'quizSentence': string (Một câu bài tập điền từ KHÁC HOÀN TOÀN với 'exampleEn'. Phải chứa 'relatedTerm' nếu là chế độ Syn/Ant, hoặc chứa 'word' nếu là chế độ thường).
    11. 'quizSentenceMeaning': string (Dịch nghĩa tiếng Việt của 'quizSentence' để hiện thị sau khi làm bài).

    Trả về mảng JSON (Type.ARRAY) các object WordData. Đảm bảo nội dung chính xác, mang tính học thuật cao.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              word: { type: Type.STRING },
              meaning: { type: Type.STRING },
              pos: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              exampleEn: { type: Type.STRING },
              exampleVn: { type: Type.STRING },
              relatedTerm: { type: Type.STRING, nullable: true },
              relatedMeaning: { type: Type.STRING, nullable: true },
              quizSentence: { type: Type.STRING, description: "Must be completely different from exampleEn" },
              quizSentenceMeaning: { type: Type.STRING, description: "Vietnamese translation of quizSentence" }
            },
            required: ["id", "word", "meaning", "pos", "phonetic", "exampleEn", "exampleVn", "quizSentence", "quizSentenceMeaning"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    // Parse cleaned JSON
    const data = JSON.parse(cleanJSON(text)) as WordData[];
    
    // FAST PRE-FETCH: Trigger immediately
    data.forEach(w => {
        // High priority
        prefetchAudio(w.word);
        if(w.relatedTerm) prefetchAudio(w.relatedTerm);
        // Medium priority (fire slightly later to not choke network immediately)
        setTimeout(() => prefetchAudio(w.exampleEn), 200);
    });
    
    return data;
  } catch (error) {
    console.error("Gemini Vocab Gen Error:", error);
    return [];
  }
};

export const lookupDictionary = async (query: string): Promise<WordData | null> => {
    const prompt = `Tra từ điển chi tiết cho: "${query}". 
    Cung cấp: Nghĩa tiếng Việt, từ loại, phiên âm, ví dụ (Anh/Việt), từ liên quan (nếu có).
    Trả về JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        word: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        pos: { type: Type.STRING },
                        phonetic: { type: Type.STRING },
                        exampleEn: { type: Type.STRING },
                        exampleVn: { type: Type.STRING },
                        relatedTerm: { type: Type.STRING, nullable: true },
                        relatedMeaning: { type: Type.STRING, nullable: true },
                        quizSentence: { type: Type.STRING, nullable: true },
                        quizSentenceMeaning: { type: Type.STRING, nullable: true }
                    },
                    required: ["word", "meaning", "pos", "phonetic", "exampleEn", "exampleVn"]
                }
            }
        });
        
        const rawText = response.text || "{}";
        const data = JSON.parse(cleanJSON(rawText));
        
        if(data.word) prefetchAudio(data.word);
        return { ...data, id: Date.now().toString() };
    } catch (e) {
        console.error(e);
        return null;
    }
};

// --- OPTIMIZED AUDIO ENGINE ---

// Store base64 strings directly in memory for instant access
const audioCache = new Map<string, string>();
const activeFetches = new Map<string, Promise<void>>();

export const prefetchAudio = async (text: string) => {
    if (!text) return;
    const cleanText = text.trim();
    if (audioCache.has(cleanText)) return;
    if (activeFetches.has(cleanText)) return;

    const fetchPromise = (async () => {
        try {
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text: text }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                  },
                },
              },
            });
        
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              audioCache.set(cleanText, base64Audio);
            }
        } catch (e) {
            console.warn("Prefetch failed for:", text);
        } finally {
            activeFetches.delete(cleanText);
        }
    })();

    activeFetches.set(cleanText, fetchPromise);
};

export const playWordAudio = async (text: string) => {
  if (!text) return;
  const cleanText = text.trim();
  
  // 1. Instant Cache Hit
  if (audioCache.has(cleanText)) {
    await playPCMAudio(audioCache.get(cleanText)!);
    return;
  }

  // 2. Wait for pending fetch
  if (activeFetches.has(cleanText)) {
      await activeFetches.get(cleanText);
      if (audioCache.has(cleanText)) {
          await playPCMAudio(audioCache.get(cleanText)!);
          return;
      }
  }

  // 3. Fetch immediately (Priority)
  try {
    await prefetchAudio(text);
    if (activeFetches.has(cleanText)) await activeFetches.get(cleanText);
    
    if (audioCache.has(cleanText)) {
        await playPCMAudio(audioCache.get(cleanText)!);
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
};