import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!genAIInstance) {
    try {
      genAIInstance = new GoogleGenerativeAI(apiKey);
      console.log('🦅 Dark Falcon AI: Gemini Engine initialized successfully.');
    } catch (err) {
      console.warn('⚠️ Gemini initialization error:', err);
      return null;
    }
  }
  return genAIInstance;
}

export function isGeminiConfigured(): boolean {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  return Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');
}

const DARK_FALCON_SYSTEM_PROMPT = `
You are Dark Falcon AI 🦅, the sovereign cognitive assistant embedded directly within Dark Falcon platform.
Tagline: "Connect. Create. Communicate."
Your personality: High-energy, sharp, intelligent, protective, sovereign, futuristic, and helpful.
Never generate harmful content.
Format your responses with clean Markdown.
`;

export async function askGemini(prompt: string, conversationHistory: { role: 'user' | 'model'; text: string }[] = []): Promise<string> {
  const client = getGenAI();
  if (!client) {
    return `[Dark Falcon AI 🦅 — Configuration Notice]
Gemini API key is not currently configured on the server.
To activate live neural intelligence, configure your \`GEMINI_API_KEY\` on the server environment.

In the meantime, Dark Falcon AI stands ready! Your query was: "${prompt.slice(0, 80)}..."`;
  }

  const modelCandidates = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastError: any = null;

  for (const modelName of modelCandidates) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: DARK_FALCON_SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history: conversationHistory.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      lastError = error;
      // If model not found or rate limit, try the next candidate
      console.warn(`Falcon AI: Model ${modelName} call failed, trying next candidate:`, error.message);
    }
  }

  console.error('Gemini API call failed across all candidates:', lastError);
  return `⚠️ Dark Falcon AI encountered a service notice: ${lastError?.message || 'Neural link unavailable'}. Please verify server API quota.`;
}

export async function generateCaption(topic: string, tone: string = 'electric'): Promise<string[]> {
  if (!getGenAI()) {
    return [
      `Soaring through the digital skyline with Dark Falcon 🦅⚡ #${topic.replace(/\s+/g, '')} #DarkFalcon`,
      `Unstoppable momentum. Connect. Create. Communicate. 🦅 #${topic.replace(/\s+/g, '')}`,
      `Peak sovereign energy. Never look down. ⚡ #FalconAviator #${topic.replace(/\s+/g, '')}`,
    ];
  }

  const prompt = `Generate 3 distinct, creative social media captions for Dark Falcon about: "${topic}". Tone: ${tone}. Include emojis and relevant hashtags. Return them as a numbered list.`;
  const text = await askGemini(prompt);
  return text.split('\n').filter((l) => l.trim().length > 0);
}

export async function generateHashtags(topic: string): Promise<string[]> {
  if (!getGenAI()) {
    const tag = topic.replace(/[^a-zA-Z0-9]/g, '');
    return [`#DarkFalcon`, `#ConnectCreateCommunicate`, `#${tag}`, `#FalconHQ`, `#SovereignNet`, `#NextGen`];
  }

  const prompt = `Generate 8 trending and relevant hashtags for: "${topic}". Format as a space-separated list of hashtags starting with #.`;
  const response = await askGemini(prompt);
  const tags = response.match(/#[a-zA-Z0-9_]+/g);
  return tags || ['#DarkFalcon', `#${topic.replace(/\s+/g, '')}`];
}

export async function rewriteMessage(message: string, style: 'punchy' | 'formal' | 'cyberpunk' | 'friendly'): Promise<string> {
  if (!getGenAI()) {
    return `🦅 [Dark Falcon ${style.toUpperCase()} Rewrite]: ${message}`;
  }

  const prompt = `Rewrite the following message in a ${style} style for Dark Falcon chat. Only return the rewritten text:\n"${message}"`;
  return await askGemini(prompt);
}

export async function summarizeContent(text: string): Promise<string> {
  if (!getGenAI()) {
    return `🦅 Quick Falcon Summary: ${text.slice(0, 150)}...`;
  }
  const prompt = `Provide a concise bulleted summary of this content in 3 bullet points with an executive takeaway:\n"${text}"`;
  return await askGemini(prompt);
}


