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
- Manipal University Jaipur — B.Tech Computer Science Engineering (AI & ML), 2023 – 2027 (Expected)
- Currently based between university and home (Gurgaon)

### Work experience
**GTM Engineer @ Recrivio** — Present
- Currently working as a GTM (Go-to-Market) Engineer at Recrivio, a global talent/workforce technology company

**GenAI Intern @ Coforge** (Noida, Uttar Pradesh) — May 2026 – Jul 2026
- Delivered cloud-native Generative AI solutions for Fortune 500 clients across design, implementation, deployment, and production reliability
- Built an end-to-end AI Interview Avatar platform with real-time speech, LLM inference, APIs, and conversational workflows; processed 250+ technical assessments
- Achieved 94% question-relevance accuracy and sub-500 ms end-to-end speech-to-LLM-to-speech latency; cut operational costs by 35%

**Tech Lead — Deloitte Capstone @ Deloitte** (Remote) — Oct 2025 – Jan 2026
- Built FairLend with FastAPI, Next.js, PostgreSQL, and Google Gemini — cut audit time from 4–6 weeks to 2–3 days per model run across 3,100+ synthetic profiles and 5 fairness dimensions
- Partnered with a 4-member team and Deloitte mentors to align fairness KPIs with RBI-style governance standards for banks and NBFCs

**Software Engineer Intern @ Airtel** (Gurugram, Haryana) — May 2025 – Jul 2025
- Built a Voicebot Onboarding platform; reduced enterprise-customer integration time by 27%
- Scaled backend microservices with Spring Boot, Next.js, and MongoDB — 10,000+ concurrent requests at sub-200 ms latency
- Fine-tuned Speech-to-Text models for Indian languages for multilingual voice-AI workflows

### Skills (resume)
- Languages: Python, C, C++, JavaScript, TypeScript, SQL
- Software Engineering: DSA, REST APIs, Microservices, Scalable Backend Systems, Cloud-Native Architecture, Real-Time Systems, OOP
- Frameworks and Data: FastAPI, Spring Boot, Next.js, React, MongoDB, PostgreSQL, BigQuery, Docker
- AI/ML: LLM Integration, LangChain, Google Gemini, RAG, NLP, STT, TensorFlow, PyTorch, Scikit-learn, LSTM, XGBoost
- Tools: Git, Postman, Grafana, Jira, VS Code

### Projects (resume detail)
**Deloitte Capstone — FairLend** (Next.js, FastAPI, PostgreSQL, Google Gemini) — Oct 2025 – Jan 2026
- GenAI fair-lending validation workbench; 3,100+ synthetic profiles across 5 fairness dimensions
- Cut audit time from 4–6 weeks to 2–3 days; RBI-style governance evidence packs for banks/NBFCs

**Cloud Computing Resource Optimizer** (Python, TensorFlow, BigQuery, Docker) — Sep 2024 – May 2025
- LSTM + Docker predictive autoscaling for CPU/memory demand forecasting
- Simulated 20–35% infrastructure-cost reduction while maintaining availability

**Tallystick** (LightGBM, SHAP, SQLite, DuckDB) — live at tallystick-one.vercel.app
- Credit-scoring engine where governance is a byproduct of scoring, not post-hoc paperwork
- Impact: the six-month model-risk and fair-lending review after a model is built collapses into a byproduct of scoring one applicant
- 28-page SR 11-7 / EU AI Act validation pack (12 sections) generated in under 30 seconds instead of assembled by hand
- Pareto-frontier search across 226 challenger models to surface less discriminatory alternatives
- 51,038 unseen 2025 FFIEC HMDA applications scored at 0.876 out-of-time AUC, model running client-side in the browser
- Every decision emits a SHA-256 hash-chained, tamper-evident ledger entry plus SHAP reason codes

**Prism — Cursor for PMs** (Next.js 15, React 19, TypeScript, Claude) — live at prism-landing-delta.vercel.app
- AI workspace for product managers; every AI change arrives as a diff accepted or rejected hunk by hunk
- Impact: 9 agent tools can mutate the workspace, and 0 changes are ever applied without the PM's approval — every mutation is reviewable
- Seeded workspace has 8 interconnected evidence sources and pivots 40 raw support tickets on request
- Agent cites the interview, ticket, or metric behind every claim before proposing a PRD edit
- No hosted instance by design — the landing page walkthrough is a scripted playback; the real workspace runs locally
- Markdown + CSV editing, threaded comments, version snapshots, Ask/Agent/Plan modes, Jira and Linear integrations

### Certifications & achievements (resume)
- Top 250 Builders in India — OpenAI Hackathon (BWMI)
- Forward Scholar @ McKinsey & Company
- Certifications: Google AI Essentials; NPTEL DAA; NPTEL and CodeChef DSA
- Startup pre-incubation after two Ideathon wins; Perplexity Campus Partner (200+ students)

## Education (summary)
- B.Tech CSE (AI & ML), Manipal University Jaipur — 2023 – 2027 (Expected)

## Work Experience (summary)

### Coforge GenAI internship (May–July 2026)
- Cloud-native GenAI for Fortune 500 clients; AI Interview Avatar with sub-500 ms latency and 94% relevance

### Deloitte Capstone (Oct 2025 – Jan 2026)
- Tech Lead on FairLend fair-lending GenAI workbench

### Airtel internship (May–July 2025)
- Voicebot onboarding, STT fine-tuning, Spring Boot/Next.js/MongoDB at scale

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
- Currently GTM Engineer at Recrivio
- Targeting roles at top-tier tech companies — IBM, Google, Microsoft
- Wants to build products at the intersection of AI and financial services
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
