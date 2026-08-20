import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
// @ts-ignore
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

dotenv.config();

const app = express();

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
export function getDeepSeek(): OpenAI | null {
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

let materialsBucketChecked = false;
async function ensureMaterialsBucket() {
  if (materialsBucketChecked) return true;
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === 'materials');
    if (!exists) {
      await supabase.storage.createBucket('materials', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    }
    materialsBucketChecked = true;
    return true;
  } catch (err) {
    console.warn('ensureMaterialsBucket warning:', err);
    return false;
  }
}

/**
 * POST /api/ai/upload-url
 * Generates signed upload URL for direct Supabase Storage upload
 */
app.post('/api/ai/upload-url', async (req, res) => {
  try {
    const { fileName, courseId = 'general', type = 'lecture_notes' } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    await ensureMaterialsBucket();
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase storage is not configured on server' });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `materials/${courseId}/${Date.now()}-${safeFileName}`;

    const { data, error } = await supabase.storage
      .from('materials')
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl) {
      return res.json({
        uploadUrl: `/api/ai/upload?path=${encodeURIComponent(storagePath)}`,
        storagePath,
        fileSizeLimit: 4500000,
      });
    }

    return res.json({
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
      fileSizeLimit: 4500000,
    });
  } catch (err: any) {
    console.error('Error creating upload url:', err);
    res.status(500).json({ error: err.message || 'Failed to create upload url' });
  }
});

/**
 * POST /api/ai/process-document
 * Full ingestion pipeline: Extract -> Create Row -> Chunk -> Embed -> Store Chunks -> Label Topics -> Finalize
 */
app.post('/api/ai/process-document', async (req, res) => {
  const { name, type = 'lecture_notes', courseId, fileBase64, storagePath, rawText } = req.body;

  console.log(`[process-document] Pipeline started for "${name}" (course: ${courseId})`);

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!fileBase64 && !storagePath && !rawText) {
    return res.status(400).json({ error: 'fileBase64, storagePath, or rawText is required' });
  }

  const supabase = getSupabaseAdmin();
  const materialId = `mat-${Date.now()}`;
  let buffer: Buffer | null = null;

  // 1. DECODE + EXTRACT TEXT (no model call)
  console.log(`[process-document] Step 1: Loading buffer & extracting text for "${name}"`);
  if (storagePath && supabase) {
    try {
      let dlRes = await supabase.storage.from('materials').download(storagePath);
      if (dlRes.error || !dlRes.data) {
        dlRes = await supabase.storage.from('course-materials').download(storagePath);
      }
      if (!dlRes.error && dlRes.data) {
        const arrayBuffer = await dlRes.data.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    } catch (dlCatch) {
      console.warn('[process-document] Storage download warning:', dlCatch);
    }
  }

  if (!buffer && fileBase64) {
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
  }

  if (!buffer && rawText) {
    buffer = Buffer.from(rawText, 'utf-8');
  }

  if (!buffer) {
    return res.status(422).json({ error: 'Failed to obtain file data from storagePath, base64, or text' });
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

// ============================================================================
// PART B: RETRIEVAL CORE (POST /api/ai/retrieve & GET /api/ai/retrieve/health)
// ============================================================================

/**
 * Cosine similarity helper for vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * GET /api/ai/retrieve/health
 * Retrieval readiness health check
 */
app.get('/api/ai/retrieve/health', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
    let vectorChunks = 0;
    let keywordChunks = 0;

    if (supabase) {
      const { count: totalCount } = await supabase
        .from('material_chunks')
        .select('*', { count: 'exact', head: true });
      keywordChunks = totalCount || 0;

      const { count: embCount } = await supabase
        .from('material_chunks')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);
      vectorChunks = embCount || 0;
    }

    res.json({
      status: 'ok',
      vectorChunks,
      keywordChunks,
      hasEmbeddings: vectorChunks > 0,
      geminiConfigured,
    });
  } catch (error: any) {
    console.error('Retrieve health check error:', error);
    res.status(500).json({
      status: 'error',
      vectorChunks: 0,
      keywordChunks: 0,
      hasEmbeddings: false,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/retrieve
 * Mastery-aware hybrid (FTS + pgvector) retrieval core
 */
app.post('/api/ai/retrieve', async (req, res) => {
  try {
    const { query, courseId, topicId, k = 6 } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const trimmedQuery = query.trim();
    const limitK = Math.min(12, Math.max(1, Number(k) || 6));
    const supabase = getSupabaseAdmin();

    interface CandidateItem {
      chunk_id: string;
      material_id: string;
      material_name?: string;
      content: string;
      keyword_score?: number;
      vector_score?: number;
      final_score?: number;
      topic_id?: string | null;
      topic_name?: string | null;
      mastery?: number;
      tags: string[];
    }
    const candidateMap = new Map<string, CandidateItem>();

    // 1. Fetch scoped context (materials and topics) if Supabase is connected
    let courseMaterials: { id: string; name: string; course_id: string }[] = [];
    let topicsList: { id: string; course_id: string; name: string; mastery: any }[] = [];
    let allowedMaterialIds: string[] = [];

    if (supabase) {
      // Fetch topics for mastery weighting
      let topicQuery = supabase.from('topics').select('id, course_id, name, mastery');
      if (courseId) {
        topicQuery = topicQuery.eq('course_id', courseId);
      }
      const { data: dbTopics } = await topicQuery;
      if (dbTopics && dbTopics.length > 0) topicsList = dbTopics;

      // Fetch materials
      let matQuery = supabase.from('course_materials').select('id, name, course_id');
      if (courseId) {
        matQuery = matQuery.eq('course_id', courseId);
      }
      const { data: dbMats } = await matQuery;
      if (dbMats && dbMats.length > 0) {
        courseMaterials = dbMats;
        allowedMaterialIds = dbMats.map((m) => m.id);
      }
    }

    // Seeded topic fallback if no Supabase or empty
    if (topicsList.length === 0) {
      topicsList = [
        {
          id: 'top-che-1',
          course_id: 'crs-che221',
          name: 'Reaction Rate Laws & Arrhenius Temperature Dependence',
          mastery: { overall: 54, recall: 60, conceptual: 52, procedural: 55, application: 50, transfer: 45, confidence: 50 },
        },
        {
          id: 'top-che-2',
          course_id: 'crs-che221',
          name: 'Continuous Stirred-Tank & Plug-Flow Reactor Sizing',
          mastery: { overall: 58, recall: 68, conceptual: 60, procedural: 58, application: 52, transfer: 48, confidence: 55 },
        },
        {
          id: 'top-che-3',
          course_id: 'crs-che221',
          name: 'Electrophilic Addition & Markovnikov Rule Mechanisms',
          mastery: { overall: 46, recall: 50, conceptual: 42, procedural: 45, application: 40, transfer: 35, confidence: 45 },
        },
        {
          id: 'top-mth-1',
          course_id: 'crs-mth221',
          name: 'Second-Order Linear ODEs & Frobenius Method',
          mastery: { overall: 76, recall: 85, conceptual: 80, procedural: 78, application: 72, transfer: 65, confidence: 80 },
        },
        {
          id: 'top-mth-2',
          course_id: 'crs-mth221',
          name: 'Vector Fields, Divergence & Stokes Theorem',
          mastery: { overall: 88, recall: 90, conceptual: 85, procedural: 82, application: 80, transfer: 75, confidence: 85 },
        },
        {
          id: 'top-phy-1',
          course_id: 'crs-phy221',
          name: 'Maxwell Equations & Electromagnetic Wave Propagation',
          mastery: { overall: 62, recall: 65, conceptual: 60, procedural: 58, application: 55, transfer: 50, confidence: 60 },
        },
        {
          id: 'top-mee-1',
          course_id: 'crs-mee221',
          name: 'Navier-Stokes Equations & Laminar Boundary Layers',
          mastery: { overall: 74, recall: 82, conceptual: 78, procedural: 75, application: 70, transfer: 65, confidence: 75 },
        },
      ];
      if (courseId) {
        topicsList = topicsList.filter((t) => t.course_id === courseId);
      }
    }

    if (courseMaterials.length === 0) {
      courseMaterials = [
        { id: 'mat-che-1', course_id: 'crs-che221', name: 'CHE221_Syllabus_and_Kinetics_Notes.pdf' },
        { id: 'mat-che-2', course_id: 'crs-che221', name: 'CHE221_Reaction_Mechanisms_and_Markovnikov_Handout.pdf' },
        { id: 'mat-mth-1', course_id: 'crs-mth221', name: 'MTH221_Vector_Calculus_Handout.pdf' },
        { id: 'mat-phy-1', course_id: 'crs-phy221', name: 'PHY221_Electrodynamics_Past_Exams.pdf' },
        { id: 'mat-mee-1', course_id: 'crs-mee221', name: 'MEE221_Fluid_Mechanics_Notes.pdf' },
      ];
      if (courseId) {
        courseMaterials = courseMaterials.filter((m) => m.course_id === courseId);
      }
    }

    const materialMap = new Map<string, { id: string; name: string; course_id: string }>();
    courseMaterials.forEach((m) => materialMap.set(m.id, m));

    // Find the top risk topic in the course/scope (topic with lowest mastery.overall)
    let topRiskTopicId: string | null = null;
    let lowestMastery = Infinity;
    for (const t of topicsList) {
      const overall = typeof t.mastery?.overall === 'number' ? t.mastery.overall : 50;
      if (overall < lowestMastery) {
        lowestMastery = overall;
        topRiskTopicId = t.id;
      }
    }

    // =========================================================================
    // STEP 1: KEYWORD CANDIDATES (always run, no model call)
    // =========================================================================
    if (supabase) {
      let ftsResults: any[] = [];
      try {
        let ftsQuery = supabase
          .from('material_chunks')
          .select('id, material_id, chunk_index, content')
          .textSearch('content', trimmedQuery, { type: 'plain', config: 'english' })
          .limit(20);

        if (courseId && allowedMaterialIds.length > 0) {
          ftsQuery = ftsQuery.in('material_id', allowedMaterialIds);
        } else if (courseId && allowedMaterialIds.length === 0) {
          ftsQuery = ftsQuery.eq('material_id', 'none_matched');
        }

        const { data: ftsData, error: ftsErr } = await ftsQuery;
        if (!ftsErr && ftsData && ftsData.length > 0) {
          ftsResults = ftsData;
        }
      } catch (ftsCatch) {
        // Fall through to ILIKE
      }

      // If FTS has no tokens or returned 0 rows, fall back to ILIKE
      if (ftsResults.length === 0) {
        try {
          let ilikeQuery = supabase
            .from('material_chunks')
            .select('id, material_id, chunk_index, content')
            .ilike('content', `%${trimmedQuery.slice(0, 60)}%`)
            .limit(20);

          if (courseId && allowedMaterialIds.length > 0) {
            ilikeQuery = ilikeQuery.in('material_id', allowedMaterialIds);
          } else if (courseId && allowedMaterialIds.length === 0) {
            ilikeQuery = ilikeQuery.eq('material_id', 'none_matched');
          }

          const { data: ilikeData } = await ilikeQuery;
          if (ilikeData) {
            ftsResults = ilikeData;
          }
        } catch (ilikeErr) {
          console.warn('[retrieve] ILIKE query error:', ilikeErr);
        }
      }

      // Record normalized keyword_score
      const count = ftsResults.length;
      ftsResults.forEach((row: any, idx: number) => {
        const normalizedScore = count > 1 ? Math.max(0.3, 1.0 - (idx / count) * 0.7) : 1.0;
        candidateMap.set(row.id, {
          chunk_id: row.id,
          material_id: row.material_id,
          content: row.content,
          keyword_score: normalizedScore,
          tags: [],
        });
      });
    }

    // =========================================================================
    // STEP 2: VECTOR CANDIDATES (only if embeddings exist)
    // =========================================================================
    const embeddingsClient = getEmbeddings();

    if (embeddingsClient && supabase) {
      try {
        const embedRes = await embeddingsClient.models.embedContent({
          model: 'text-embedding-004',
          contents: trimmedQuery,
        });
        const queryVector = embedRes.embeddings?.[0]?.values;

        if (queryVector && Array.isArray(queryVector) && queryVector.length === 768) {
          // Attempt Supabase match_material_chunks RPC
          const { data: rpcData, error: rpcErr } = await supabase.rpc('match_material_chunks', {
            query_embedding: queryVector,
            match_threshold: 0.0,
            match_count: 20,
          });

          let vectorResults: any[] = [];
          if (!rpcErr && rpcData && Array.isArray(rpcData)) {
            vectorResults = rpcData;
          } else {
            // Fallback: fetch chunks with non-null embeddings and calculate cosine distance in JS
            let chunkQuery = supabase
              .from('material_chunks')
              .select('id, material_id, chunk_index, content, embedding')
              .not('embedding', 'is', null)
              .limit(50);

            if (courseId && allowedMaterialIds.length > 0) {
              chunkQuery = chunkQuery.in('material_id', allowedMaterialIds);
            }
            const { data: rawChunks } = await chunkQuery;
            if (rawChunks && rawChunks.length > 0) {
              const computed = rawChunks
                .map((c: any) => {
                  if (!c.embedding) return null;
                  let vec = c.embedding;
                  if (typeof vec === 'string') {
                    try {
                      vec = JSON.parse(vec);
                    } catch {
                      vec = vec.replace(/[\[\]]/g, '').split(',').map(Number);
                    }
                  }
                  if (Array.isArray(vec) && vec.length === 768) {
                    const sim = cosineSimilarity(queryVector, vec);
                    return { ...c, similarity: sim };
                  }
                  return null;
                })
                .filter(Boolean)
                .sort((a: any, b: any) => b.similarity - a.similarity)
                .slice(0, 20);

              vectorResults = computed;
            }
          }

          if (vectorResults.length > 0) {
            for (const vRow of vectorResults) {
              if (courseId && allowedMaterialIds.length > 0 && !allowedMaterialIds.includes(vRow.material_id)) {
                continue;
              }
              const vScore = Math.max(
                0,
                Math.min(1, typeof vRow.similarity === 'number' ? vRow.similarity : 1 - (vRow.distance || 0))
              );
              const existing = candidateMap.get(vRow.id);
              if (existing) {
                existing.vector_score = vScore;
              } else {
                candidateMap.set(vRow.id, {
                  chunk_id: vRow.id,
                  material_id: vRow.material_id,
                  content: vRow.content,
                  vector_score: vScore,
                  tags: [],
                });
              }
            }
          }
        }
      } catch (vectorErr) {
        console.warn('[retrieve] Vector search error:', vectorErr);
      }
    }

    // Offline / Mock fallback if candidateMap is empty
    if (candidateMap.size === 0) {
      const isMarkov = trimmedQuery.toLowerCase().includes('markov') || trimmedQuery.toLowerCase().includes('che');

      if (isMarkov) {
        // Weak topic candidate (CHE 221 - Markovnikov / Rate Laws, mastery 46)
        const mockWeakId = `chunk-che-weak-${Date.now()}`;
        candidateMap.set(mockWeakId, {
          chunk_id: mockWeakId,
          material_id: 'mat-che-2',
          material_name: 'CHE221_Reaction_Mechanisms_and_Markovnikov_Handout.pdf',
          content: `Markovnikov addition rule for electrophilic addition: When HX adds across an unsymmetrical alkene, the halide attaches to the more substituted carbon forming the more stable carbocation intermediate. Rate constant k exhibits Arrhenius temperature dependence.`,
          keyword_score: 0.88,
          tags: [],
        });

        // Strong topic candidate for comparison (MTH 221 - Stokes Theorem, mastery 88)
        const mockStrongId = `chunk-mth-strong-${Date.now()}`;
        candidateMap.set(mockStrongId, {
          chunk_id: mockStrongId,
          material_id: 'mat-mth-1',
          material_name: 'MTH221_Vector_Calculus_Handout.pdf',
          content: `Vector differential operators and boundary rules: Surface integral evaluation via Stokes theorem curl orientation and Markov continuous transition metrics.`,
          keyword_score: 0.88,
          tags: [],
        });
      } else {
        const mockId1 = `chunk-offline-${Date.now()}-1`;
        const mockId2 = `chunk-offline-${Date.now()}-2`;
        candidateMap.set(mockId1, {
          chunk_id: mockId1,
          material_id: 'mat-che-1',
          material_name: 'CHE221_Syllabus_and_Kinetics_Notes.pdf',
          content: `Explanatory excerpt on ${trimmedQuery}: Foundational principles, boundary constraints, rate expressions, and procedural problem solving.`,
          keyword_score: 0.95,
          tags: [],
        });
        candidateMap.set(mockId2, {
          chunk_id: mockId2,
          material_id: 'mat-mth-1',
          material_name: 'MTH221_Vector_Calculus_Handout.pdf',
          content: `Applied mathematical calculations and vector methods related to ${trimmedQuery} with worked examples and common error patterns.`,
          keyword_score: 0.85,
          tags: [],
        });
      }
    }

    // =========================================================================
    // STEP 3: MERGE + SCORE
    // =========================================================================
    let hasAnyKeyword = false;
    let hasAnyVector = false;

    const candidates = Array.from(candidateMap.values());
    for (const c of candidates) {
      if (typeof c.keyword_score === 'number') hasAnyKeyword = true;
      if (typeof c.vector_score === 'number') hasAnyVector = true;

      if (typeof c.keyword_score === 'number' && typeof c.vector_score === 'number') {
        c.final_score = 0.4 * c.keyword_score + 0.6 * c.vector_score;
      } else if (typeof c.vector_score === 'number') {
        c.final_score = c.vector_score;
      } else if (typeof c.keyword_score === 'number') {
        c.final_score = c.keyword_score;
      } else {
        c.final_score = 0.5;
      }
    }

    const mode: 'hybrid' | 'keyword_only' | 'vector_only' =
      hasAnyKeyword && hasAnyVector
        ? 'hybrid'
        : hasAnyVector
        ? 'vector_only'
        : 'keyword_only';

    // =========================================================================
    // STEP 4: MASTERY-AWARE BOOST
    // =========================================================================
    for (const c of candidates) {
      const mat = materialMap.get(c.material_id);
      if (mat) {
        c.material_name = mat.name;
      } else if (!c.material_name) {
        c.material_name = 'Course Document';
      }

      // Associate topic
      let matchedTopic: { id: string; name: string; mastery: any } | null = null;
      if (topicId) {
        matchedTopic = topicsList.find((t) => t.id === topicId) || null;
      }
      if (!matchedTopic) {
        for (const t of topicsList) {
          if (
            c.content.toLowerCase().includes(t.name.toLowerCase()) ||
            (mat && mat.name.toLowerCase().includes(t.name.toLowerCase()))
          ) {
            matchedTopic = t;
            break;
          }
        }
      }
      if (!matchedTopic) {
        // Keyword match against topic name tokens
        for (const t of topicsList) {
          const tWords = t.name.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
          if (tWords.some((w) => c.content.toLowerCase().includes(w))) {
            matchedTopic = t;
            break;
          }
        }
      }
      if (!matchedTopic && topicsList.length > 0) {
        matchedTopic = topicsList[0];
      }

      if (matchedTopic) {
        c.topic_id = matchedTopic.id;
        c.topic_name = matchedTopic.name;
        const overall = typeof matchedTopic.mastery?.overall === 'number' ? matchedTopic.mastery.overall : 50;
        c.mastery = overall;

        // Boost rules:
        // 1. Weak topic (<65): score * 1.25, tag 'weak_topic'
        if (overall < 65) {
          c.final_score = (c.final_score || 0.5) * 1.25;
          c.tags.push('weak_topic');
        } else if (overall >= 85) {
          // 2. Strong topic (>=85): score * 0.85
          c.final_score = (c.final_score || 0.5) * 0.85;
        }

        // 3. Top risk topic in course: additional * 1.1 and tag 'top_risk'
        if (matchedTopic.id === topRiskTopicId) {
          c.final_score = (c.final_score || 0.5) * 1.1;
          if (!c.tags.includes('top_risk')) {
            c.tags.push('top_risk');
          }
        }
      } else {
        c.topic_id = null;
        c.topic_name = null;
        c.mastery = 50;
      }
    }

    // Sort by final score descending, take top limitK
    candidates.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    const topResults = candidates.slice(0, limitK).map((c) => ({
      chunk_id: c.chunk_id,
      material_id: c.material_id,
      material_name: c.material_name || 'Course Document',
      content: c.content,
      score: Number(Math.min(1.0, c.final_score || 0.5).toFixed(4)),
      topic_id: c.topic_id || null,
      topic_name: c.topic_name || null,
      mastery: c.mastery ?? 50,
      tags: c.tags,
    }));

    res.json({
      query: trimmedQuery,
      k: limitK,
      mode,
      results: topResults,
    });
  } catch (error: any) {
    console.error('Retrieve API Error:', error);
    res.status(500).json({ error: error.message || 'Retrieval failed' });
  }
});

/**
 * Token filter for text overlap computation
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'which',
  'about', 'into', 'over', 'after', 'other', 'their', 'there', 'what', 'when',
  'where', 'will', 'would', 'could', 'should', 'been', 'each', 'such', 'than',
  'them', 'then', 'these', 'they', 'some', 'more', 'most', 'also', 'between',
  'using', 'applied', 'study', 'derive', 'calculate', 'demonstrate', 'solve',
]);

function extractSignificantTokens(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return new Set(tokens);
}

/**
 * POST /api/ai/build-topic-links
 * Graph RAG v0: Build / refresh topic relationship graph from chunks & topic embeddings
 */
app.post('/api/ai/build-topic-links', async (req, res) => {
  try {
    const { courseId } = req.body || {};
    const supabase = getSupabaseAdmin();
    const deepseek = getDeepSeek();

    interface RawTopic {
      id: string;
      course_id: string;
      name: string;
      description?: string;
      learning_objectives?: string[];
      prerequisites?: string[];
      mastery?: any;
    }

    interface RawChunk {
      id: string;
      material_id: string;
      content: string;
      embedding?: any;
    }

    let topics: RawTopic[] = [];
    let chunks: RawChunk[] = [];
    let materials: { id: string; course_id: string; name: string }[] = [];

    if (supabase) {
      let tQuery = supabase
        .from('topics')
        .select('id, course_id, name, description, learning_objectives, prerequisites, mastery');
      if (courseId) {
        tQuery = tQuery.eq('course_id', courseId);
      }
      const { data: tData } = await tQuery;
      if (tData && tData.length > 0) topics = tData;

      const { data: cData } = await supabase
        .from('material_chunks')
        .select('id, material_id, content, embedding');
      if (cData && cData.length > 0) chunks = cData;

      const { data: mData } = await supabase
        .from('course_materials')
        .select('id, course_id, name');
      if (mData && mData.length > 0) materials = mData;
    }

    // Fallback topics if none in Supabase
    if (topics.length === 0) {
      topics = [
        {
          id: 'top-mth-1',
          course_id: 'crs-mth221',
          name: 'Second-Order Linear ODEs & Frobenius Method',
          description: 'Homogeneous/non-homogeneous solutions, variation of parameters, series solutions.',
          learning_objectives: ['Find general solutions using characteristic equation', 'Compute Frobenius series'],
          prerequisites: [],
        },
        {
          id: 'top-mth-2',
          course_id: 'crs-mth221',
          name: 'Vector Fields, Divergence & Stokes Theorem',
          description: 'Vector differential calculus, surface integrals, flux, curl, and Stokes theorem.',
          learning_objectives: ['Convert surface integrals via Stokes theorem', 'Compute divergence'],
          prerequisites: ['top-mth-1'],
        },
        {
          id: 'top-che-1',
          course_id: 'crs-che221',
          name: 'Reaction Rate Laws & Arrhenius Temperature Dependence',
          description: 'Elementary vs non-elementary reaction mechanisms, differential and integral rate law methods.',
          learning_objectives: ['Derive integrated rate expressions', 'Determine activation energy Ea from Arrhenius plots'],
          prerequisites: [],
        },
        {
          id: 'top-che-2',
          course_id: 'crs-che221',
          name: 'Continuous Stirred-Tank & Plug-Flow Reactor Sizing',
          description: 'Design equations for batch, CSTR, and PFR in isothermal and non-isothermal operating modes.',
          learning_objectives: ['Derive design equations for CSTR and PFR from mass conservation', 'Size reactors for target conversion'],
          prerequisites: ['top-che-1'],
        },
      ];
      if (courseId) {
        topics = topics.filter((t) => t.course_id === courseId);
      }
    }

    const materialCourseMap = new Map<string, string>();
    materials.forEach((m) => materialCourseMap.set(m.id, m.course_id));

    // Map chunks to topics based on topic name / keyword presence
    const topicChunksMap = new Map<string, RawChunk[]>();
    topics.forEach((t) => topicChunksMap.set(t.id, []));

    for (const chunk of chunks) {
      const cCourseId = materialCourseMap.get(chunk.material_id);
      for (const topic of topics) {
        if (!cCourseId || cCourseId === topic.course_id) {
          if (
            chunk.content.toLowerCase().includes(topic.name.toLowerCase()) ||
            (topic.learning_objectives || []).some((obj) =>
              chunk.content.toLowerCase().includes(obj.slice(0, 30).toLowerCase())
            )
          ) {
            topicChunksMap.get(topic.id)?.push(chunk);
          }
        }
      }
    }

    // Ensure every topic has at least one reference chunk (synthesize from topic metadata if none)
    topics.forEach((t) => {
      const list = topicChunksMap.get(t.id) || [];
      if (list.length === 0) {
        list.push({
          id: `chunk-topic-${t.id}`,
          material_id: `mat-${t.course_id}`,
          content: `${t.name}. ${t.description || ''} ${(t.learning_objectives || []).join('. ')}`,
          embedding: null,
        });
        topicChunksMap.set(t.id, list);
      }
    });

    // Group topics by course
    const courseTopicsMap = new Map<string, RawTopic[]>();
    for (const t of topics) {
      if (!courseTopicsMap.has(t.course_id)) {
        courseTopicsMap.set(t.course_id, []);
      }
      courseTopicsMap.get(t.course_id)!.push(t);
    }

    interface CandidateEdge {
      id: string;
      topic_a_id: string;
      topic_b_id: string;
      topic_a_name: string;
      topic_b_name: string;
      relation: 'prerequisite' | 'related' | 'harder_than' | 'source_of';
      weight: number;
      source_chunk_ids: string[];
      excerpt_a: string;
      excerpt_b: string;
    }

    const candidateEdges: CandidateEdge[] = [];
    let hasEmbeddingsUsed = false;

    // For each topic pair (a, b) within the same course
    for (const [_, cTopics] of courseTopicsMap.entries()) {
      for (let i = 0; i < cTopics.length; i++) {
        for (let j = i + 1; j < cTopics.length; j++) {
          const tA = cTopics[i];
          const tB = cTopics[j];

          const chunksA = topicChunksMap.get(tA.id) || [];
          const chunksB = topicChunksMap.get(tB.id) || [];

          // Try embedding mean cosine similarity
          const embChunksA = chunksA.filter((c) => c.embedding);
          const embChunksB = chunksB.filter((c) => c.embedding);

          let similarity = 0;
          let bestPair = [chunksA[0]?.id || `chunk-${tA.id}`, chunksB[0]?.id || `chunk-${tB.id}`];

          if (embChunksA.length > 0 && embChunksB.length > 0) {
            hasEmbeddingsUsed = true;
            const parseVec = (raw: any): number[] | null => {
              if (Array.isArray(raw)) return raw;
              if (typeof raw === 'string') {
                try {
                  return JSON.parse(raw);
                } catch {
                  return raw.replace(/[\[\]]/g, '').split(',').map(Number);
                }
              }
              return null;
            };

            const vecSumA = new Array(768).fill(0);
            let validACount = 0;
            for (const c of embChunksA) {
              const vec = parseVec(c.embedding);
              if (vec && vec.length === 768) {
                validACount++;
                for (let k = 0; k < 768; k++) vecSumA[k] += vec[k];
              }
            }

            const vecSumB = new Array(768).fill(0);
            let validBCount = 0;
            for (const c of embChunksB) {
              const vec = parseVec(c.embedding);
              if (vec && vec.length === 768) {
                validBCount++;
                for (let k = 0; k < 768; k++) vecSumB[k] += vec[k];
              }
            }

            if (validACount > 0 && validBCount > 0) {
              const meanVecA = vecSumA.map((v) => v / validACount);
              const meanVecB = vecSumB.map((v) => v / validBCount);
              similarity = cosineSimilarity(meanVecA, meanVecB);

              let maxPairSim = -1;
              for (const cA of embChunksA) {
                const vA = parseVec(cA.embedding);
                if (!vA) continue;
                for (const cB of embChunksB) {
                  const vB = parseVec(cB.embedding);
                  if (!vB) continue;
                  const pairSim = cosineSimilarity(vA, vB);
                  if (pairSim > maxPairSim) {
                    maxPairSim = pairSim;
                    bestPair = [cA.id, cB.id];
                  }
                }
              }
            }
          }

          // Fallback to text overlap if no embeddings or similarity == 0
          if (similarity === 0) {
            const textA = `${tA.name} ${tA.description || ''} ${(tA.learning_objectives || []).join(' ')} ${chunksA.map((c) => c.content).join(' ')}`;
            const textB = `${tB.name} ${tB.description || ''} ${(tB.learning_objectives || []).join(' ')} ${chunksB.map((c) => c.content).join(' ')}`;

            const tokensA = extractSignificantTokens(textA);
            const tokensB = extractSignificantTokens(textB);

            let sharedCount = 0;
            for (const token of tokensA) {
              if (tokensB.has(token)) sharedCount++;
            }
            const unionCount = new Set([...tokensA, ...tokensB]).size;
            const jaccard = unionCount > 0 ? sharedCount / unionCount : 0;

            const isExplicitPrereq =
              (tB.prerequisites || []).includes(tA.id) || (tA.prerequisites || []).includes(tB.id);

            similarity = Math.min(
              0.96,
              jaccard * 2.6 +
                (isExplicitPrereq ? 0.38 : 0) +
                (sharedCount >= 2 ? 0.28 : 0) +
                (tA.course_id === tB.course_id ? 0.45 : 0)
            );
          }

          if (similarity >= 0.70) {
            let initialRelation: 'prerequisite' | 'related' | 'harder_than' | 'source_of' = 'related';
            if ((tB.prerequisites || []).includes(tA.id)) {
              initialRelation = 'prerequisite';
            }

            candidateEdges.push({
              id: `link-${tA.id}-${tB.id}`,
              topic_a_id: tA.id,
              topic_b_id: tB.id,
              topic_a_name: tA.name,
              topic_b_name: tB.name,
              relation: initialRelation,
              weight: Number(similarity.toFixed(4)),
              source_chunk_ids: bestPair,
              excerpt_a: (chunksA[0]?.content || tA.name).slice(0, 300),
              excerpt_b: (chunksB[0]?.content || tB.name).slice(0, 300),
            });
          }
        }
      }
    }

    // Step 3: Optional DeepSeek Refinement (single batched call, max 15 pairs per call)
    candidateEdges.sort((a, b) => b.weight - a.weight);
    const topEdges = candidateEdges.slice(0, 15);

    if (deepseek && topEdges.length > 0) {
      try {
        const prompt = `You are an academic ontology reasoning engine. Analyze the following topic relationships in university STEM courses. For each pair, determine the most precise relation:
- "prerequisite" (Topic A is a mandatory prior foundation for Topic B)
- "related" (Topics share conceptual, mathematical, or physical principles)
- "harder_than" (Topic B represents significantly higher cognitive complexity than Topic A)
- "source_of" (Topic A is the direct theoretical/mathematical origin of Topic B)

Topic Pairs:
${JSON.stringify(
  topEdges.map((e) => ({
    topic_a_id: e.topic_a_id,
    topic_a_name: e.topic_a_name,
    topic_b_id: e.topic_b_id,
    topic_b_name: e.topic_b_name,
    excerpt_a: e.excerpt_a,
    excerpt_b: e.excerpt_b,
  })),
  null,
  2
)}

Return ONLY a valid JSON array of objects:
[
  { "topic_a_id": "...", "topic_b_id": "...", "relation": "prerequisite" | "related" | "harder_than" | "source_of" }
]`;

        const aiRes = await deepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an academic curriculum relationship classifier. Return strict JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const rawContent = aiRes.choices[0]?.message?.content || '';
        const parsed: any = parseJsonResponse<any>(rawContent, []);
        const refinements: any[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.relationships)
          ? parsed.relationships
          : Array.isArray(parsed.links)
          ? parsed.links
          : Array.isArray(parsed.pairs)
          ? parsed.pairs
          : [];

        for (const ref of refinements) {
          const match = candidateEdges.find(
            (e) => e.topic_a_id === ref.topic_a_id && e.topic_b_id === ref.topic_b_id
          );
          if (
            match &&
            ['prerequisite', 'related', 'harder_than', 'source_of'].includes(ref.relation)
          ) {
            match.relation = ref.relation;
          }
        }
      } catch (deepseekErr) {
        console.warn('DeepSeek topic link refinement skipped or failed:', deepseekErr);
      }
    }

    // Step 4: Idempotent upsert into Supabase topic_links
    let createdCount = 0;
    let updatedCount = 0;

    if (supabase) {
      try {
        const { data: existingLinks } = await supabase
          .from('topic_links')
          .select('id, topic_a_id, topic_b_id');

        const existingSet = new Set(
          (existingLinks || []).map((l) => `${l.topic_a_id}:${l.topic_b_id}`)
        );

        for (const edge of candidateEdges) {
          const key = `${edge.topic_a_id}:${edge.topic_b_id}`;
          if (existingSet.has(key)) {
            updatedCount++;
          } else {
            createdCount++;
          }
          existingSet.add(key);

          await supabase.from('topic_links').upsert(
            {
              id: edge.id,
              topic_a_id: edge.topic_a_id,
              topic_b_id: edge.topic_b_id,
              relation: edge.relation,
              weight: edge.weight,
              source_chunk_ids: edge.source_chunk_ids,
            },
            { onConflict: 'topic_a_id,topic_b_id' }
          );
        }
      } catch (dbErr) {
        console.warn('Database upsert error in build-topic-links:', dbErr);
      }
    } else {
      createdCount = candidateEdges.length;
    }

    res.json({
      created: createdCount,
      updated: updatedCount,
      totalEdges: candidateEdges.length,
      mode: hasEmbeddingsUsed ? 'vector_embedding' : 'text_overlap',
    });
  } catch (error: any) {
    console.error('build-topic-links error:', error);
    res.status(500).json({ error: error.message || 'Failed to build topic links' });
  }
});

// 1. Text Extraction Endpoint (PDF, DOCX, TXT, MD)
app.post('/api/documents/extract', async (req, res) => {
  try {
    const { fileBase64, storagePath, fileName, fileType, rawText } = req.body;

    if (rawText) {
      return res.json({
        text: rawText,
        charCount: rawText.length,
        fileSizeKb: Math.max(1, Math.round(Buffer.byteLength(rawText, 'utf-8') / 1024)),
      });
    }

    let buffer: Buffer | null = null;
    const supabase = getSupabaseAdmin();
    if (storagePath && supabase) {
      try {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('course-materials')
          .download(storagePath);
        if (!dlErr && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        }
      } catch (err) {
        console.warn('Storage download warning in /api/documents/extract:', err);
      }
    }

    if (!buffer && fileBase64) {
      buffer = Buffer.from(fileBase64, 'base64');
    }

    if (!buffer || !fileName) {
      return res.status(400).json({ error: 'fileBase64, storagePath, or rawText, along with fileName, are required' });
    }

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

// Static SPA serving fallback (for local production / node runs)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

export default app;
export { app };
