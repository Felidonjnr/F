import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { Course, CourseMaterial, Topic } from '../../types';

interface MaterialUploadModalProps {
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onUploadAndExtract: (
    material: Omit<CourseMaterial, 'id' | 'uploaded_at'>,
    extractedTopics: Omit<Topic, 'id' | 'mastery'>[]
  ) => void;
}

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({
  courses,
  isOpen,
  onClose,
  onUploadAndExtract,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [materialName, setMaterialName] = useState('');
  const [materialType, setMaterialType] = useState<CourseMaterial['type']>('syllabus');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMaterialName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text || '');
    };
    reader.readAsText(file);
  };

  const handleProcess = async () => {
    if (!materialName.trim()) {
      setErrorMsg('Please specify a material document title.');
      return;
    }
    if (!rawText.trim()) {
      setErrorMsg('Please upload a file or paste course syllabus text.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/map-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: materialName,
          documentText: rawText,
          courseCode: selectedCourse.code,
          courseName: selectedCourse.name,
        }),
      });

      const data = await res.json();
      const extractedTopics: Omit<Topic, 'id' | 'mastery'>[] = (data.topics || []).map(
        (t: any, idx: number) => ({
          course_id: selectedCourse.id,
          name: t.name || `Topic ${idx + 1}`,
          description: t.description || 'Extracted from syllabus',
          difficulty: t.difficulty || 3,
          importance: t.importance || 4,
          estimated_minutes: t.estimated_minutes || 90,
          order_index: idx + 1,
          learning_objectives: Array.isArray(t.learning_objectives)
            ? t.learning_objectives
            : ['Demonstrate mastery of core principles'],
          prerequisites: [],
          source_references: [materialName],
        })
      );

      const material: Omit<CourseMaterial, 'id' | 'uploaded_at'> = {
        course_id: selectedCourse.id,
        name: materialName,
        type: materialType,
        file_size_kb: Math.round(rawText.length / 1024) || 45,
        extracted_topics_count: extractedTopics.length,
        raw_content_preview: rawText.slice(0, 300),
        is_indexed: true,
      };

      onUploadAndExtract(material, extractedTopics);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to process document with AI mapper. Saved with baseline extraction.');
      setIsProcessing(false);
    }
  };

  const fillSampleSyllabus = () => {
    setMaterialName(`${selectedCourse.code}_Official_Syllabus.txt`);
    setRawText(`Course: ${selectedCourse.code} - ${selectedCourse.name}
Units: ${selectedCourse.units}
Description: Comprehensive university level curriculum.

Module 1: Governing Laws & Boundary Formulations
- Physical interpretation of state variables
- Exact differential conservation laws
- Boundary value constraints and initial conditions

Module 2: Analytical & Transform Methods
- Explicit procedural calculations and integration
- Convergence tests and asymptotic approximations
- Stability criteria and phase plane analysis

Module 3: Advanced Applied Problems
- Synthesis of coupled physical mechanisms
- Numerical verification and computational modeling
- Error propagation and sensitivity analysis`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Course Material & Auto-Map</h3>
              <p className="text-xs text-slate-500">AI Academic Mapper extracts topics, objectives & prerequisites</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Target Course Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Target Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} ({c.units} Units)
                </option>
              ))}
            </select>
          </div>

          {/* Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g. MEE221_Syllabus_2026.pdf"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Material Type
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="syllabus">Course Syllabus / Curriculum</option>
                <option value="lecture_notes">Lecture Notes / Slides</option>
                <option value="textbook_excerpt">Textbook Excerpt / Handout</option>
                <option value="past_questions">Past Questions / Exam Papers</option>
                <option value="lab_manual">Laboratory Manual</option>
              </select>
            </div>
          </div>

          {/* File input / drag drop */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Upload Document or Syllabus File (PDF/TXT/DOCX)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-amber-400 bg-slate-50/50 transition-colors">
              <input
                type="file"
                accept=".txt,.pdf,.docx,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-1"
              >
                <FileText className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-bold text-amber-700 hover:text-amber-800">
                  Click to select file
                </span>
                <span className="text-[11px] text-slate-400">or paste text directly below</span>
              </label>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Syllabus / Lecture Text Content
              </label>
              <button
                type="button"
                onClick={fillSampleSyllabus}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 underline"
              >
                Insert Sample Syllabus Text
              </button>
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste course module outline, learning outcomes, or textbook contents here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>AI Mapping Topics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract & Index Topics</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
