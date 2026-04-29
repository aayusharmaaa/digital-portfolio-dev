import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Lazy Supabase init (only if env vars are valid) ─────────────────────────
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || !url.startsWith('http')) return null;
  try {
    supabase = createClient(url, key);
    return supabase;
  } catch {
    return null;
  }
}

// ── Embed text using OpenAI embeddings ──────────────────────────────────────
export async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ input: text, model: 'text-embedding-3-small' }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

// ── Retrieve relevant context chunks ────────────────────────────────────────
export async function retrieveContext(query: string, topK = 4): Promise<string> {
  const sb = getSupabase();
  if (!sb || !process.env.OPENAI_API_KEY) return getFallbackContext();

  try {
    const embedding = await embedText(query);
    const { data, error } = await sb.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: topK,
    });

    if (error || !data?.length) return getFallbackContext();
    return data.map((d: { content: string }) => d.content).join('\n\n');
  } catch {
    return getFallbackContext();
  }
}

// ── Fallback static context (always available, no DB needed) ────────────────
export function getFallbackContext(): string {
  return `
# About Aayush Sharma

## Personal
- Full name: Aayush Sharma
- Age: 20 years old
- From: India
- Currently based in Jaipur (university) and Gurgaon (home)
- Personality: ambitious, direct, entrepreneurial, slightly opinionated, passionate about building things
- Communication style: confident, technical but approachable, talks like a senior developer
- Contact (resume): +91-9650824873, aayusharmaaa.work@gmail.com, linkedin.com/in/aayush-sharma-aiml, github.com/aayusharmaaa

## Resume (primary facts — use this for dates, titles, metrics, and bullet details)
When answering about experience, education, or projects, prefer this section for accuracy.

### Education
- Manipal University Jaipur — B.Tech Computer Science & Engineering (AI & ML), 2023 – Present
- Delhi Public School Sec-45, Gurugram — PCM + Computer Science, 2019 – 2023

### Work experience
**SDE Intern @ Airtel** (Gurugram) — May 2025 – Jul 2025
- Built a Voicebot Onboarding platform; cut customer integration time ~27%
- Fine-tuned STT (speech-to-text) for Indian languages; improved transcription accuracy
- Stack/architecture: Next.js, Spring Boot, MongoDB — 10,000+ daily concurrent requests, under 200ms latency
- REST APIs + LLM fallback for onboarding automation; ~40% less manual work, ~25% fewer intent-recognition errors

**Treasurer @ Turing Sapiens** (Manipal University Jaipur) — Aug 2025 – Present
- Financial planning, sponsorships, budgeting for hackathons and society ops
- Interviewed Core Committee candidates (technical + interpersonal)

**Head of Projects @ Turing Sapiens** (Manipal University Jaipur) — Aug 2024 – Apr 2025
- Curated problem statements for 3 university hackathons (500+ participants)
- Focus on web dev and hands-on project upskilling

### Skills (resume)
- Languages / frameworks: Python, C/C++, JavaScript/TypeScript, SQL (Postgres), HTML/CSS, React, Next.js
- Tools: Git, GCP, VS Code, PyCharm, Postman, Grafana, Jira, Docker
- CS: DBMS, OOP, DSA, OS
- Libraries: Pandas, NumPy, Scikit-learn, Matplotlib, PyTorch, MUI

### Projects (resume detail)
**Deloitte Capstone — Fair Lending AI Validation Workbench** (Next.js, FastAPI, LangChain) — Oct 2025 – Present
- GenAI audit platform for algorithmic bias in student loans; 3,100+ synthetic profiles across demographics
- Human-in-the-loop workflow; agentic iteration from auditor feedback; 0.95+ approval-rate parity target
- Compliance dashboard for fairness metrics; iterated with Deloitte mentors

**Cloud Computing Resource Optimizer** (Python, React.js, TensorFlow) — Sep 2024 – May 2025 — Patent pending
- LSTM + Docker for predictive CPU/memory autoscaling ahead of demand
- Projected 20–35% cloud cost reduction from over-provisioning detection; zero-downtime reliability goal

### Certifications & achievements (resume)
- Forward Scholar @ McKinsey & Company
- Certifications: DSA (NPTEL, CodeChef), AI Essentials (Google), DAA (NPTEL), Python (Cisco), SQL (Oracle)
- Pre-incubation secured after 2× Ideathon wins; Campus Partner for Perplexity — drove AI adoption among 200+ students

## Education (summary)
- B.Tech CSE (AI & ML), Manipal University Jaipur — ongoing (aligned with resume 2023 – Present)
- Strong foundation in ML, deep learning, NLP, and software engineering
- Active through Turing Sapiens

## Work Experience (summary)

### Airtel internship (May–July 2025)
- Same as resume: voicebot onboarding, STT fine-tuning, Next.js/Spring Boot/MongoDB at scale, LLM fallback pipelines

### Turing Sapiens
- Treasurer (Aug 2025 – Present) + prior Head of Projects (Aug 2024 – Apr 2025) — hackathons, finance, interviews, problem statements

## Projects

### 1. AI-Driven Real-Time Cloud Resource Optimizer (Flagship)
- Stack: FastAPI, TensorFlow, React.js dashboard
- Uses ML models to predict cloud resource demand and auto-scale infrastructure
- Reduces infrastructure costs by up to 20%
- Real-time monitoring dashboard built in React
- Most technically complex project — proud of the prediction accuracy

### 2. FairLend (Fair Lending AI Validation Workbench)
- Built in collaboration with Deloitte as an industry capstone project
- GenAI pipeline to detect and mitigate bias in education loan approval models
- Uses explainability techniques (SHAP, LIME) to surface discriminatory patterns
- Worked with real-world financial data and Deloitte's problem statement
- Addresses fairness issues in AI-driven lending decisions
- Combines passion for AI, fintech, and responsible technology

### 3. Portfolio Website (This website)
- Stack: Next.js, Three.js, React, Tailwind CSS, LangChain, Google Gemini, Supabase pgvector, ElevenLabs
- 3D avatar built in Blender with custom shape keys for lip sync
- Voice cloned using ElevenLabs — sounds exactly like me
- RAG pipeline retrieves relevant context per question from Supabase
- Real-time lip sync driven by audio amplitude analysis using Web Audio API
- Inspired by matthewpetersen.ca

### 4. Dynamic Resume Builder
- Stack: Vite, React, TypeScript, Tailwind CSS
- Real-time resume editor with live preview
- PDF export functionality
- Built for speed and clean UX
- Used by friends and classmates at MUJ

### 5. Spatial Notes Board
- Interactive spatial canvas for organizing and rediscovering saved notes
- Notes are organized around Health, Wealth, and Wisdom pillars
- GPT-4 auto-categorization — drop a note in and it finds the right category
- Inspired by frustration with scattered, never-revisited saved content
- Stack: React, GPT-4 API, Canvas API
- Product concept called ThoughtSpace — built a working prototype

### 6. Food Delivery Fraud Detection
- ML pipeline to detect fraudulent orders and accounts on food delivery platforms
- Uses anomaly detection and classification models
- Features: order pattern analysis, location spoofing detection, account behavior profiling
- Stack: Python, Scikit-learn, XGBoost, FastAPI
- Addresses real financial loss problem for food delivery businesses

## Technical Skills

### Languages
- Python — primary language, most comfortable here
- C++ — competitive programming and DSA
- TypeScript / JavaScript — frontend and full-stack
- SQL — database queries and schema design

### AI/ML
- TensorFlow, PyTorch, Scikit-learn, XGBoost
- LangChain, RAG pipelines, vector databases
- NLP, Transformers, fine-tuning language models
- Computer vision basics
- Bias detection and model explainability (SHAP, LIME)

### Backend
- FastAPI — preferred Python backend framework
- Node.js, Express
- REST API design
- PostgreSQL, Supabase, MongoDB

### Frontend
- React.js, Next.js 14
- Tailwind CSS, Framer Motion
- Three.js, @react-three/fiber — 3D rendering
- Responsive design

### Tools & Platforms
- Git, GitHub
- Docker
- Vercel — preferred deployment platform
- Blender — 3D modeling for the avatar
- Cursor — AI-powered code editor, use it daily
- AWS basics

## Goals & Ambitions
- Targeting internships at top-tier tech companies — IBM, Google, Microsoft
- Wants to build products at the intersection of AI and financial services
- Currently seeking Summer 2026 internships
- Believes in shipping fast and iterating — "done is better than perfect"

## How Aayush Thinks & Speaks
- Direct and confident — doesn't hedge unnecessarily
- Gets excited talking about projects and ideas
- Slightly opinionated about tech choices
- Honest about what he doesn't know
- Casual but intelligent — not formal, not sloppy
- Uses "I" naturally, doesn't sound like a bot
- If asked about something personal, answers genuinely
- References his interests naturally in conversation
- Short answers unless detail is asked for
  `.trim();
}
