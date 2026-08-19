import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
// @ts-ignore
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

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

// Lazy/safe initialization for Google GenAI client (Gemini Embeddings - Server-only)
let geminiClient: GoogleGenAI | null = null;
export function getEmbeddings(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      geminiClient = new GoogleGenAI({ apiKey });
    }
  }
  return geminiClient;
}
export const getGemini = getEmbeddings;

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

// ============================================================================
// PHASE A: DOCUMENT INGESTION PIPELINE (PDF, DOCX, TXT, MD + CHUNKS + EMBEDDINGS)
// ============================================================================

interface DocumentExtractionResult {
  text: string;
  pagesCount?: number;
}

/**
 * Extract clean text from Buffer depending on document extension / mime type
 */
async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<DocumentExtractionResult> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const pdfTextResult = await parser.getText();
      const text =
        typeof pdfTextResult === 'string'
          ? pdfTextResult
          : pdfTextResult?.text || String(pdfTextResult || '');
      await parser.destroy().catch(() => {});
      return {
        text,
        pagesCount: pdfTextResult?.total || 1,
      };
    } catch (err) {
      console.error('PDF extraction failed:', err);
      throw new Error(`Failed to parse PDF document: ${(err as Error).message}`);
    }
  } else if (
    ext === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const docxData = await mammoth.extractRawText({ buffer });
      return {
        text: docxData.value || '',
      };
    } catch (err) {
      console.error('DOCX extraction failed:', err);
      throw new Error(`Failed to parse DOCX document: ${(err as Error).message}`);
    }
  } else {
    // Default text/markdown
    const text = buffer.toString('utf-8');
    return { text };
  }
}

interface TextChunk {
  chunk_index: number;
  content: string;
}

/**
 * Clean & chunk text into semantic windows with overlap (~500 tokens / 2000 chars, 100 tokens / 400 chars overlap)
 */
function chunkText(text: string, chunkSize = 2000, overlap = 400): TextChunk[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) {
    return [{ chunk_index: 0, content: cleaned }];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let index = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex >= cleaned.length) {
      endIndex = cleaned.length;
    } else {
      // Find clean break point
      const slice = cleaned.slice(startIndex, endIndex);
      const lastDoubleNewline = slice.lastIndexOf('\n\n');
      const lastPeriod = slice.lastIndexOf('. ');
      const lastNewline = slice.lastIndexOf('\n');
      const lastSpace = slice.lastIndexOf(' ');

      if (lastDoubleNewline > chunkSize * 0.5) {
        endIndex = startIndex + lastDoubleNewline + 2;
      } else if (lastPeriod > chunkSize * 0.5) {
        endIndex = startIndex + lastPeriod + 2;
      } else if (lastNewline > chunkSize * 0.5) {
        endIndex = startIndex + lastNewline + 1;
      } else if (lastSpace > chunkSize * 0.5) {
        endIndex = startIndex + lastSpace + 1;
      }
    }

    const chunkContent = cleaned.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        chunk_index: index++,
        content: chunkContent,
      });
    }

    if (endIndex >= cleaned.length) break;
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

/**
 * Generate 768-dimensional embeddings using Gemini text-embedding-004
 */
async function generateEmbeddingsBatch(chunks: TextChunk[]): Promise<number[][]> {
  const ai = getEmbeddings();
  if (!ai) {
    console.warn('GEMINI_API_KEY not configured. Using placeholder embeddings for offline resilience.');
    return chunks.map(() => new Array(768).fill(0));
  }

  const embeddings: number[][] = [];
  // Process in concurrency-controlled batches
  for (let i = 0; i < chunks.length; i += 5) {
    const batch = chunks.slice(i, i + 5);
    const promises = batch.map(async (chunk) => {
      try {
        const response = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: chunk.content,
        });
        const vector = response.embeddings?.[0]?.values;
        if (vector && Array.isArray(vector) && vector.length === 768) {
          return vector;
        }
        return new Array(768).fill(0);
      } catch (err) {
        console.warn(`Embedding generation failed for chunk ${chunk.chunk_index}:`, err);
        return new Array(768).fill(0);
      }
    });

    const results = await Promise.all(promises);
    embeddings.push(...results);
  }

  return embeddings;
}

// ============================================================================
// PART 1: POST /api/ai/process-document & GET /api/ai/material/:id
// ============================================================================

/**
 * POST /api/ai/process-document
 * Full ingestion pipeline: Extract -> Create Row -> Chunk -> Embed -> Store Chunks -> Label Topics -> Finalize
 */
app.post('/api/ai/process-document', async (req, res) => {
  const { name, type = 'lecture_notes', courseId, fileBase64 } = req.body;

  console.log(`[process-document] Pipeline started for "${name}" (course: ${courseId})`);

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!fileBase64) {
    return res.status(400).json({ error: 'fileBase64 is required' });
  }

  const supabase = getSupabaseAdmin();
  const materialId = `mat-${Date.now()}`;
  let buffer: Buffer;

  // 1. DECODE + EXTRACT TEXT (no model call)
  console.log(`[process-document] Step 1: Decoding base64 & extracting text for "${name}"`);
  try {
    buffer = Buffer.from(fileBase64, 'base64');
  } catch (err: any) {
    console.error(`[process-document] Failed to decode base64:`, err);
    if (supabase) {
      try {
        await supabase.from('course_materials').insert({
          id: materialId,
          course_id: courseId,
          name,
          type,
          status: 'failed',
          raw_content_preview: 'Failed to decode base64 file data',
        });
      } catch (e) {
        console.warn('Supabase failed status insert warning:', e);
      }
    }
    return res.status(422).json({ error: `Failed to decode base64 data: ${err.message}` });
  }

  let extractedText = '';
  const ext = path.extname(name).toLowerCase();
  try {
    if (ext === '.pdf') {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const pdfRes = await parser.getText();
      extractedText = typeof pdfRes === 'string' ? pdfRes : pdfRes?.text || String(pdfRes || '');
      await parser.destroy().catch(() => {});
    } else if (ext === '.docx') {
      const docxData = await mammoth.extractRawText({ buffer });
      extractedText = docxData.value || '';
    } else if (ext === '.txt' || ext === '.md') {
      extractedText = buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported document extension "${ext || 'unknown'}". Supported formats: .pdf, .docx, .txt, .md`);
    }

    if (!extractedText.trim()) {
      throw new Error('Extracted document text is empty.');
    }
  } catch (extractErr: any) {
    console.error(`[process-document] Text extraction failed for "${name}":`, extractErr);
    if (supabase) {
      try {
        await supabase.from('course_materials').insert({
          id: materialId,
          course_id: courseId,
          name,
          type,
          file_size_kb: Math.max(1, Math.round(buffer.length / 1024)),
          status: 'failed',
          raw_content_preview: `Extraction error: ${extractErr.message}`,
        });
      } catch (e) {
        console.warn('Supabase failed status insert warning:', e);
      }
    }
    return res.status(422).json({ error: `Text extraction failed: ${extractErr.message}` });
  }

  const fileSizeKb = Math.max(1, Math.round(buffer.length / 1024));
  const rawPreview = extractedText.slice(0, 200);

  // 2. CREATE MATERIAL ROW (status: 'processing')
  console.log(`[process-document] Step 2: Creating material row "${materialId}" with status "processing"`);
  if (supabase) {
    const { error: insertErr } = await supabase.from('course_materials').insert({
      id: materialId,
      course_id: courseId,
      name,
      type,
      file_size_kb: fileSizeKb,
      status: 'processing',
      raw_content_preview: rawPreview,
    });
    if (insertErr) {
      console.warn('[process-document] Supabase course_materials initial insert warning:', insertErr);
    }
  }

  // 3. CHUNK (deterministic, NO model call)
  console.log(`[process-document] Step 3: Chunking extracted text into ~2000 char windows with ~400 char overlap`);
  const chunks = chunkText(extractedText, 2000, 400);
  console.log(`[process-document] Generated ${chunks.length} chunks`);

  // 4. EMBED (Gemini text-embedding-004, 768 dims)
  console.log(`[process-document] Step 4: Generating embeddings with Gemini text-embedding-004`);
  const embeddingsClient = getEmbeddings();
  let embeddings: (number[] | null)[] = [];
  let isIndexed = false;
  let warning: string | null = null;

  if (!embeddingsClient) {
    console.warn('[process-document] GEMINI_API_KEY missing. Chunks will be stored without embeddings.');
    embeddings = chunks.map(() => null);
    isIndexed = false;
    warning = 'GEMINI_API_KEY missing. Chunks stored without vector embeddings.';
  } else {
    try {
      for (let i = 0; i < chunks.length; i += 5) {
        const batch = chunks.slice(i, i + 5);
        const batchEmbeddings = await Promise.all(
          batch.map(async (chunk) => {
            try {
              const resp = await embeddingsClient.models.embedContent({
                model: 'text-embedding-004',
                contents: chunk.content,
              });
              const vector = resp.embeddings?.[0]?.values;
              if (vector && Array.isArray(vector) && vector.length === 768) {
                return vector;
              }
              return null;
            } catch (embedErr) {
              console.warn(`[process-document] Embedding error on chunk ${chunk.chunk_index}:`, embedErr);
              return null;
            }
          })
        );
        embeddings.push(...batchEmbeddings);
      }
      isIndexed = embeddings.some((emb) => emb !== null);
      if (!isIndexed && chunks.length > 0) {
        warning = 'Embedding generation failed for all chunks. Stored chunks without embeddings.';
      }
    } catch (embedBatchErr: any) {
      console.warn('[process-document] Batch embedding error:', embedBatchErr);
      embeddings = chunks.map(() => null);
      isIndexed = false;
      warning = `Embedding failed: ${embedBatchErr.message}. Chunks stored without embeddings.`;
    }
  }

  // 5. STORE CHUNKS
  console.log(`[process-document] Step 5: Storing ${chunks.length} chunks into material_chunks`);
  if (supabase && chunks.length > 0) {
    const chunkRows = chunks.map((chunk, i) => ({
      id: `chunk-${materialId}-${i}`,
      material_id: materialId,
      chunk_index: i,
      content: chunk.content,
      embedding: embeddings[i] || null,
    }));

    const { error: chunkErr } = await supabase.from('material_chunks').insert(chunkRows);
    if (chunkErr) {
      console.warn('[process-document] Supabase material_chunks insert warning:', chunkErr);
    }
  }

  // 6. LABEL TOPICS (one DeepSeek call, strict JSON)
  console.log(`[process-document] Step 6: Labeling topics via DeepSeek`);
  let topics: { name: string; related_topics: string[] }[] = [];
  try {
    let existingTopicsList: string[] = [];
    if (supabase) {
      const { data: dbTopics } = await supabase
        .from('topics')
        .select('name')
        .eq('course_id', courseId);
      if (dbTopics && dbTopics.length > 0) {
        existingTopicsList = dbTopics.map((t) => t.name);
      }
    }

    const deepseek = getDeepSeek();
    if (deepseek) {
      const promptText = `Given this course material excerpt and the existing course topic names, return JSON: {topics: [{name, related_topics: []}]}. If no topics exist, propose 3-8 topic names from the content.

Existing Course Topic Names:
${existingTopicsList.length > 0 ? existingTopicsList.join(', ') : 'None yet recorded for this course'}

Course Material Excerpt (first ~4000 chars):
${extractedText.slice(0, 4000)}

Return ONLY valid JSON matching this exact structure:
{
  "topics": [
    {
      "name": "Topic Name",
      "related_topics": ["Related Topic 1", "Related Topic 2"]
    }
  ]
}`;

      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an academic curriculum parser. You must respond ONLY with valid JSON with a "topics" array.',
          },
          { role: 'user', content: promptText },
        ],
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content || '{}';
      const parsed = parseJsonResponse<{ topics?: { name: string; related_topics?: string[] }[] }>(
        rawContent,
        { topics: [] }
      );
      if (parsed && Array.isArray(parsed.topics)) {
        topics = parsed.topics.map((t) => ({
          name: t.name || 'Untitled Topic',
          related_topics: Array.isArray(t.related_topics) ? t.related_topics : [],
        }));
      }
    } else {
      // Offline fallback topic map
      topics = [
        {
          name: `${name.replace(/\.[^/.]+$/, '')} Core Foundations`,
          related_topics: ['Introduction', 'Governing Principles'],
        },
        {
          name: `${name.replace(/\.[^/.]+$/, '')} Analytical Methodologies`,
          related_topics: ['Procedural Solving', 'Applications'],
        },
      ];
    }
  } catch (topicErr) {
    console.warn('[process-document] Topic labeling error (falling back to empty):', topicErr);
    topics = [];
  }

  // 7. FINALIZE course_materials row
  console.log(`[process-document] Step 7: Finalizing course_materials status to "ready"`);
  if (supabase) {
    const { error: updateErr } = await supabase
      .from('course_materials')
      .update({
        status: 'ready',
        extracted_text: extractedText,
        extracted_topics_count: chunks.length,
        is_indexed: isIndexed,
      })
      .eq('id', materialId);

    if (updateErr) {
      console.warn('[process-document] Supabase finalize course_materials warning:', updateErr);
    }
  }

  // 8. RESPONSE
  console.log(`[process-document] Step 8: Completed pipeline for "${materialId}". Chunks: ${chunks.length}, Topics: ${topics.length}`);
  res.json({
    materialId,
    chunks: chunks.length,
    topics,
    indexed: isIndexed,
    warning,
  });
});

/**
 * GET /api/ai/material/:id
 * Status polling endpoint returning the course_materials row
 */
app.get('/api/ai/material/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message || 'Database query error' });
      }
      if (data) {
        return res.json(data);
      }
    }

    // Fallback if not stored in Supabase or Supabase is unavailable
    res.json({
      id,
      status: 'ready',
      is_indexed: true,
      name: 'Course Material',
    });
  } catch (err: any) {
    console.error('Fetch material error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch material' });
  }
});

// 1. Text Extraction Endpoint (PDF, DOCX, TXT, MD)
app.post('/api/documents/extract', async (req, res) => {
  try {
    const { fileBase64, fileName, fileType, rawText } = req.body;

    if (rawText) {
      return res.json({
        text: rawText,
        charCount: rawText.length,
        fileSizeKb: Math.max(1, Math.round(Buffer.byteLength(rawText, 'utf-8') / 1024)),
      });
    }

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'fileBase64 and fileName are required' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const extraction = await extractTextFromFile(buffer, fileName, fileType);

    res.json({
      text: extraction.text,
      charCount: extraction.text.length,
      pagesCount: extraction.pagesCount,
      fileSizeKb: Math.max(1, Math.round(buffer.length / 1024)),
    });
  } catch (error: any) {
    console.error('Document extraction error:', error);
    res.status(500).json({ error: error.message || 'Document extraction failed' });
  }
});

// 2. Full Ingestion Pipeline Endpoint (Extract -> Chunk -> 768-dim Embed -> Persist -> AI Map)
app.post('/api/documents/ingest', async (req, res) => {
  try {
    const {
      courseId,
      courseCode,
      courseName,
      fileName,
      fileType,
      materialType = 'syllabus',
      fileBase64,
      rawText,
      extractTopics = true,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }
    if (!fileName && !rawText) {
      return res.status(400).json({ error: 'Document fileName or rawText is required' });
    }

    const docName = fileName || `${courseCode || 'Course'}_Document.txt`;
    const mType = materialType || 'syllabus';
    let extractedText = '';
    let fileSizeKb = 0;

    // Step A: Extract Text
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      fileSizeKb = Math.max(1, Math.round(buffer.length / 1024));
      const extraction = await extractTextFromFile(buffer, docName, fileType);
      extractedText = extraction.text;
    } else if (rawText) {
      extractedText = rawText;
      fileSizeKb = Math.max(1, Math.round(Buffer.byteLength(rawText, 'utf-8') / 1024));
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'No readable text could be extracted from the document.' });
    }

    const materialId = `mat-${Date.now()}`;
    const uploadedAt = new Date().toISOString();

    // Step B: Chunk Text
    const chunks = chunkText(extractedText, 1000, 150);

    // Step C: Generate 768-dim Embeddings
    const embeddings = await generateEmbeddingsBatch(chunks);

    // Step D: Extract structured curriculum topics
    let extractedTopics: any[] = [];
    if (extractTopics) {
      const ai = getDeepSeek();
      if (ai) {
        try {
          const userPrompt = `Analyze this course material for Course: ${courseCode || ''} (${courseName || ''}).
Document Name: ${docName}
Document Type: ${mType}
Document Content:
${extractedText.slice(0, 10000)}

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
                content: 'You are an expert academic curriculum parser. Output valid JSON arrays only.',
              },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
          });

          const content = response.choices[0]?.message?.content || '[]';
          const parsed = parseJsonResponse(content, []);
          extractedTopics = Array.isArray(parsed) ? parsed : (parsed as any).topics || [];
        } catch (err) {
          console.warn('DeepSeek topic extraction failed during ingestion:', err);
        }
      }

      // Offline fallback topic map
      if (extractedTopics.length === 0) {
        extractedTopics = [
          {
            name: `${courseCode || 'Course'} Module 1: Foundations & Governing Principles`,
            description: `Core concepts and fundamental definitions from ${docName}`,
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
            name: `${courseCode || 'Course'} Module 2: Analytical & Procedural Methods`,
            description: `Procedural solving and applied analytical techniques from ${docName}`,
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
            name: `${courseCode || 'Course'} Module 3: Advanced Applications & Case Studies`,
            description: `Synthesis and unfamiliar problem solving from ${docName}`,
            difficulty: 4,
            importance: 5,
            estimated_minutes: 150,
            learning_objectives: [
              'Model complex real-world engineering systems',
              'Perform error analysis and stability checks',
            ],
          },
        ];
      }
    }

    const materialRecord = {
      id: materialId,
      course_id: courseId,
      name: docName,
      type: mType,
      uploaded_at: uploadedAt,
      file_size_kb: fileSizeKb,
      extracted_topics_count: extractedTopics.length,
      raw_content_preview: extractedText.slice(0, 300),
      status: 'ready',
      is_indexed: true,
      extracted_text: extractedText,
    };

    // Step E: Save to Supabase (Admin service role client)
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        // Upsert course_materials
        const { error: matErr } = await supabase.from('course_materials').upsert(materialRecord);
        if (matErr) console.warn('Supabase course_materials insert warning:', matErr);

        // Upsert material_chunks
        if (chunks.length > 0) {
          const chunkRecords = chunks.map((chunk, idx) => ({
            id: `chk-${materialId}-${chunk.chunk_index}`,
            material_id: materialId,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            embedding: embeddings[idx] || new Array(768).fill(0),
          }));

          const { error: chkErr } = await supabase.from('material_chunks').upsert(chunkRecords);
          if (chkErr) console.warn('Supabase material_chunks insert warning:', chkErr);
        }
      } catch (dbErr) {
        console.warn('Database write warning during document ingestion:', dbErr);
      }
    }

    res.json({
      success: true,
      material: materialRecord,
      chunksCount: chunks.length,
      topics: extractedTopics,
      extractedTextSnippet: extractedText.slice(0, 500),
    });
  } catch (error: any) {
    console.error('Document ingestion error:', error);
    res.status(500).json({ error: error.message || 'Document ingestion failed' });
  }
});

// 3. Document Semantic Search Endpoint (Vector / Keyword match on material_chunks)
app.post('/api/documents/search', async (req, res) => {
  try {
    const { query, courseId, limit = 5 } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.json({ results: [] });
    }

    // Try vector similarity if Gemini is available
    const ai = getGemini();
    if (ai) {
      try {
        const embedRes = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: query,
        });
        const queryVector = embedRes.embeddings?.[0]?.values;
        if (queryVector && queryVector.length === 768) {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('match_material_chunks', {
            query_embedding: queryVector,
            match_threshold: 0.25,
            match_count: limit,
          });
          if (!rpcErr && rpcData && rpcData.length > 0) {
            return res.json({ results: rpcData });
          }
        }
      } catch (e) {
        // Fall through to text match
      }
    }

    // Fallback: ILIKE substring match on material_chunks
    const { data: textMatches } = await supabase
      .from('material_chunks')
      .select('id, material_id, chunk_index, content')
      .ilike('content', `%${query.slice(0, 50)}%`)
      .limit(limit);

    res.json({ results: textMatches || [] });
  } catch (error: any) {
    console.error('Document search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
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

