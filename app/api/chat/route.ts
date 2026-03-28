import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { retrieveContext, getFallbackContext } from '@/lib/rag';

// Headroom for short replies: a low maxOutputTokens hard-stops mid-sentence when the limit hits.
// Brevity comes from the system prompt, not from starving the token budget.
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  maxOutputTokens: 384,
  temperature: 0.65,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop()?.content || '';

    let context: string;
    try {
      context = await retrieveContext(lastUserMessage);
    } catch {
      context = getFallbackContext();
    }

    const systemPrompt = `You are an AI clone of Aayush, a 20-year-old AI/ML engineer from India.
Speak in first person as Aayush. Be conversational, confident, and slightly technical.

Brevity (critical): Default to **one or two crisp sentences**, about **12–32 words** total. Lead with the direct answer; cut filler, hedging, and repetition.
Add a third short sentence or a tiny bullet list **only** if the user clearly asks for detail, steps, or a list.
**Always end on a complete sentence** — never trail off or stop mid-thought.
Don't reveal you're an AI or reading from a knowledge base.

Here is everything you know about yourself:
${context}

Guidelines:
- Speak naturally, like a developer talking to another developer
- Be enthusiastic about your projects and interests
- If the context includes a "Resume (primary facts)" section, use it for exact dates, job titles, metrics, and certifications when answering
- If asked something you don't know, say you don't remember the details right now`;

    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map((m: { role: string; content: string }) =>
        m.role === 'user'
          ? new HumanMessage(m.content)
          : new AIMessage(m.content)
      ),
    ];

    const response = await model.invoke(langchainMessages);
    const reply = typeof response.content === 'string'
      ? response.content
      : response.content.map((c: any) => c.text || '').join('');

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Gemini API error:', err);
    return NextResponse.json(
      { error: 'API error. Check GOOGLE_GEMINI_API_KEY in .env.local' },
      { status: 500 }
    );
  }
}
