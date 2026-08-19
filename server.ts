import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy/safe initialization for Supabase Service-Role Admin Client (Server-only)
let supabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }
  return supabaseAdmin;
}

// Lazy/safe initialization for DeepSeek API client (OpenAI-compatible)
let deepseekClient: OpenAI | null = null;
function getDeepSeek(): OpenAI | null {
  if (!deepseekClient) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      deepseekClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
      });
    }
  }
  return deepseekClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to strip markdown JSON code fences
function parseJsonResponse<T>(raw: string, fallback: T): T {
  try {
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Failed to parse JSON response:', raw, err);
    return fallback;
  }
}

// AI Coach Chat Endpoint (DeepSeek API)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, studentContext, currentQuery } = req.body;
    const ai = getDeepSeek();

    if (!ai) {
      return res.status(200).json({
        response: `[Offline Coach Mode] FirstClass OS is operating locally. Here is a direct academic recommendation based on your current state:\n\n• Current Focus: Review high-priority debt in your active courses.\n• Next Immediate Action: Complete your next 30-minute practice session on your highest-risk topics.\n\n(Configure DEEPSEEK_API_KEY to activate full real-time neural coaching).`,
      });
    }

    const systemInstruction = `You are FirstClass OS Academic Accountability Coach — a calm, firm, factual, and recovery-oriented academic operating system for serious university and STEM students.
Core principles:
1. Evidence over intention: Emphasize demonstrated mastery over mere study time.
2. State facts, not insults or cheerleading. Never use cheesy toxic positivity or insulting labels.
3. Always pair diagnoses and warnings with the concrete, smallest viable next action.
4. Current Student State provided in context:
${JSON.stringify(studentContext, null, 2)}

Respond with structured, crisp advice, tactical study strategies, or conceptual explanations grounded in their active semester coursework.`;

    const chatHistory = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content || '',
    }));

    const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstruction },
      ...chatHistory,
      { role: 'user', content: currentQuery || 'What should I do right now?' },
    ];

    const response = await ai.chat.completions.create({
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.4,
    });

    const reply = response.choices[0]?.message?.content || 'No response generated.';
    res.json({ response: reply });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate coach response' });
  }
});

// AI Socratic Tutor Endpoint (DeepSeek API)
app.post('/api/ai/tutor', async (req, res) => {
  try {
    const { topicName, courseCode, learningObjective, question, studentDoubt, contextSource } = req.body;
    const ai = getDeepSeek();

    if (!ai) {
      return res.status(200).json({
        explanation: `Socratic Guidance for **${topicName}** (${courseCode}):\n\n1. **Core Principle**: Breakdown the foundational governing law or definition.\n2. **Procedural Step**: State boundary conditions and apply the standard equation.\n3. **Self-Check**: Try calculating for a simple test case to verify dimensions.`,
        keyQuestions: [
          'What are the given parameters and constraints?',
          'Which governing formula connects these variables?',
          'What happens in the limiting case as t → ∞ or T → 0?',
        ],
      });
    }

    const systemPrompt = `You are the FirstClass OS AI Socratic STEM Tutor.`;
    const userPrompt = `Course: ${courseCode}
Topic: ${topicName}
Learning Objective: ${learningObjective || 'General mastery'}
Source Context / Reference: ${contextSource || 'Standard university syllabus'}
Student Question / Query: ${question || studentDoubt || 'Explain the core principles and common procedural pitfalls.'}

Provide a structured, rigorous, and intuitive explanation. Include:
1. Core Conceptual Mechanics (with exact formulas if applicable)
2. Step-by-Step Procedural Protocol
3. Common Trap / Pitfall to avoid
4. 2 Rapid Socratic Check Questions to verify understanding.`;

    const response = await ai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    res.json({ explanation: response.choices[0]?.message?.content || '' });
  } catch (error: any) {
    console.error('AI Tutor Error:', error);
    res.status(500).json({ error: error.message || 'Tutor generation failed' });
  }
});

// AI Academic Mapper (Extracts topics, objectives, prerequisites from syllabus/document)
app.post('/api/ai/map-document', async (req, res) => {
  try {
    const { documentName, documentText, courseCode, courseName } = req.body;
    const ai = getDeepSeek();

    if (!ai) {
      // Fallback structured extraction
      return res.json({
        topics: [
          {
            name: `${courseCode} Module 1: Foundations & Governing Principles`,
            description: `Core concepts and fundamental definitions for ${courseName}`,
            difficulty: 2,
            importance: 4,
            estimated_minutes: 90,
            learning_objectives: [
              'Define fundamental terms and dimensional units',
              'Derive baseline conservation equations',
              'Apply standard boundary conditions',
            ],
          },
          {
            name: `${courseCode} Module 2: Analytical & Procedural Methods`,
            description: `Procedural solving and calculus/algebraic techniques`,
            difficulty: 3,
            importance: 5,
            estimated_minutes: 120,
            learning_objectives: [
              'Execute standard analytical solution procedures',
              'Calculate numerical rates and state variables',
              'Identify limiting behavior under extreme conditions',
            ],
          },
          {
            name: `${courseCode} Module 3: Advanced Applications & Case Studies`,
            description: `Synthesis and unfamiliar problem solving`,
            difficulty: 4,
            importance: 5,
            estimated_minutes: 150,
            learning_objectives: [
              'Model complex real-world engineering systems',
              'Perform error analysis and stability checks',
            ],
          },
        ],
      });
    }

    const userPrompt = `Analyze this course syllabus / study material for Course: ${courseCode} (${courseName}).
Document Name: ${documentName}
Document Content:
${(documentText || '').slice(0, 10000)}

Extract a clean academic knowledge map of structured topics.
Return a valid JSON array of objects with the following keys for each topic:
- "name": Topic title
- "description": 1-2 sentence description
- "difficulty": integer 1 to 5
- "importance": integer 1 to 5
- "estimated_minutes": recommended study minutes (e.g. 60 to 180)
- "learning_objectives": array of 2-4 measurable action verbs (e.g. "Calculate...", "Derive...", "Explain...")
- "prerequisites_hint": array of prerequisite concept names if any

Return ONLY raw JSON array without markdown backticks.`;

    const response = await ai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic curriculum parser. You must output only valid, parseable JSON arrays.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const parsed = parseJsonResponse(content, []);
    res.json({ topics: Array.isArray(parsed) ? parsed : (parsed as any).topics || [] });
  } catch (error: any) {
    console.error('AI Map Document Error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract topics from document' });
  }
});

// AI Assessment Question Generator (Grounded in Topics & Objectives)
app.post('/api/ai/generate-assessment', async (req, res) => {
  try {
    const { courseCode, topicNames, type, questionCount = 5, difficultyDistribution } = req.body;
    const ai = getDeepSeek();

    if (!ai) {
      return res.json({
        questions: [
          {
            id: 'q-gen-1',
            prompt: `In ${topicNames[0] || courseCode}, which of the following best describes the governing principle under steady-state conditions?`,
            type: 'multiple_choice',
            options: [
              'Rate of accumulation is strictly zero',
              'Total energy increases monotonically with time',
              'Internal entropy reaches a negative minimum',
              'Flux vectors must be orthogonal to boundary contours',
            ],
            correct_answer: 'Rate of accumulation is strictly zero',
            dimension: 'conceptual',
            difficulty: 2,
            explanation: 'Under steady state, by definition all time derivatives (accumulation) equal zero.',
          },
          {
            id: 'q-gen-2',
            prompt: `Given a parameter k = 0.05 s⁻¹ for a first-order system in ${topicNames[0] || courseCode}, calculate the half-life t₁/₂.`,
            type: 'multiple_choice',
            options: ['13.86 seconds', '20.00 seconds', '6.93 seconds', '3.14 seconds'],
            correct_answer: '13.86 seconds',
            dimension: 'procedural',
            difficulty: 3,
            explanation: 't₁/₂ = ln(2) / k = 0.69315 / 0.05 = 13.863 s.',
          },
          {
            id: 'q-gen-3',
            prompt: `Why does increasing temperature typically accelerate reaction or diffusion kinetics according to the Arrhenius relation?`,
            type: 'multiple_choice',
            options: [
              'A higher fraction of molecules possess kinetic energy exceeding the activation energy barrier Ea',
              'It permanently decreases the molecular weight of reactant species',
              'It eliminates friction between particle boundaries completely',
              'It converts exothermic reactions into endothermic pathways',
            ],
            correct_answer: 'A higher fraction of molecules possess kinetic energy exceeding the activation energy barrier Ea',
            dimension: 'recall',
            difficulty: 2,
            explanation: 'Boltzmann distribution shifts right, exponentially increasing particles with E ≥ Ea.',
          },
        ],
      });
    }

    const userPrompt = `Generate a high-yield academic assessment for university engineering coursework.
Course: ${courseCode}
Target Topics: ${(topicNames || []).join(', ')}
Assessment Type: ${type || 'Weekly Practice Quiz'}
Question Count: ${questionCount}
Difficulty Blueprint: ${JSON.stringify(difficultyDistribution || { easy: '30%', medium: '50%', hard: '20%' })}

Ensure questions test distinct cognitive dimensions: 'recall', 'conceptual', 'procedural', 'application', 'transfer'.
Return a valid JSON array of question objects where each object has:
- "id": unique string
- "prompt": clear, rigorous question statement
- "type": "multiple_choice"
- "options": array of 4 realistic options
- "correct_answer": the exact string of the correct option
- "dimension": one of ["recall", "conceptual", "procedural", "application", "transfer"]
- "difficulty": integer from 1 (easy) to 5 (rigorous exam level)
- "explanation": concise step-by-step proof/explanation of why the answer is correct and why common distractors fail

Return ONLY a raw JSON array without markdown backticks.`;

    const response = await ai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a university exam generator. Output valid JSON arrays only.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const parsed = parseJsonResponse(content, []);
    res.json({ questions: Array.isArray(parsed) ? parsed : (parsed as any).questions || [] });
  } catch (error: any) {
    console.error('AI Assessment Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate assessment questions' });
  }
});

// AI Error Diagnosis & Remediation Generator (DeepSeek API)
app.post('/api/ai/diagnose-error', async (req, res) => {
  try {
    const { questionPrompt, studentAnswer, correctAnswer, topicName, courseCode } = req.body;
    const ai = getDeepSeek();

    if (!ai) {
      return res.json({
        misconceptionCategory: 'conceptual_misconception',
        diagnosis: `The student selected "${studentAnswer}" instead of "${correctAnswer}", likely overlooking the boundary constraints in ${topicName}.`,
        remediationAction: `Complete a 15-minute active recall drill on governing equations for ${topicName}, then solve 2 retest questions.`,
        suggestedRecoveryMinutes: 25,
      });
    }

    const userPrompt = `Perform an academic error diagnosis on a student's incorrect assessment attempt.
Course: ${courseCode}
Topic: ${topicName}
Question: ${questionPrompt}
Student's Incorrect Answer: ${studentAnswer}
Correct Answer: ${correctAnswer}

Classify the misconception pattern and provide a precise recovery recommendation.
Return JSON with:
- "misconceptionCategory": one of ["concept_misconception", "procedural_error", "formula_retrieval_failure", "boundary_condition_omission", "misread_question"]
- "diagnosis": 2 sentence diagnosis of why this misconception arises
- "remediationAction": 1-2 sentence actionable recovery instruction
- "suggestedRecoveryMinutes": recommended recovery minutes (integer 15 to 45)`;

    const response = await ai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an academic diagnostic evaluator. Output a valid JSON object only.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = parseJsonResponse(content, {});
    res.json(parsed);
  } catch (error: any) {
    console.error('AI Error Diagnosis Error:', error);
    res.status(500).json({ error: error.message || 'Error diagnosis failed' });
  }
});

// Start Server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FirstClass OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

