import React, { useState } from 'react';
import { BookOpen, Check, Trash2, X } from 'lucide-react';
import { Course, Topic } from '../../types';

interface TopicModalProps {
  course: Course;
  topic?: Topic | null;
  existingTopics: Topic[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (topicData: Omit<Topic, 'id' | 'mastery'>, isEdit: boolean, topicId?: string) => void;
  onDelete?: (topicId: string) => void;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  course,
  topic,
  existingTopics,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(topic?.name || '');
  const [description, setDescription] = useState(topic?.description || '');
  const [difficulty, setDifficulty] = useState(topic?.difficulty || 3);
  const [importance, setImportance] = useState(topic?.importance || 4);
  const [estimatedMinutes, setEstimatedMinutes] = useState(topic?.estimated_minutes || 120);
  const [objectivesText, setObjectivesText] = useState(
    (topic?.learning_objectives || ['']).join('\n')
  );
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>(topic?.prerequisites || []);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const learning_objectives = objectivesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSave(
      {
        course_id: course.id,
        name: name.trim(),
        description: description.trim(),
        difficulty,
        importance,
        estimated_minutes: estimatedMinutes,
        order_index: topic?.order_index || existingTopics.length + 1,
        learning_objectives:
          learning_objectives.length > 0 ? learning_objectives : ['Master core principles and solve practice problems'],
        prerequisites: selectedPrereqs,
        source_references: topic?.source_references || [`${course.code} Lecture Notes`],
      },
      Boolean(topic),
      topic?.id
    );
    onClose();
  };

  const togglePrereq = (id: string) => {
    if (selectedPrereqs.includes(id)) {
      setSelectedPrereqs(selectedPrereqs.filter((p) => p !== id));
    } else {
      setSelectedPrereqs([...selectedPrereqs, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {topic ? 'Edit Topic & Learning Objectives' : 'Add New Topic to Knowledge Map'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">Course: {course.code} ({course.name})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Topic Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Topic Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stokes Theorem & Surface Integrals"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Conceptual Scope / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of governing concepts and mathematical techniques..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Difficulty & Importance & Minutes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Difficulty (1-5)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Level {n} {n === 5 ? '(Hardest)' : n === 1 ? '(Intro)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Importance (1-5)
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Weight {n} {n === 5 ? '(Core Exam)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Est. Minutes
              </label>
              <input
                type="number"
                min={30}
                max={360}
                step={15}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Learning Objectives (one per line) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Measurable Learning Objectives (One per line)
            </label>
            <textarea
              rows={3}
              value={objectivesText}
              onChange={(e) => setObjectivesText(e.target.value)}
              placeholder="e.g.&#10;Derive governing differential equations&#10;Calculate boundary flux integrals&#10;Verify dimensional consistency"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Prerequisites */}
          {existingTopics.filter((t) => t.id !== topic?.id).length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Prerequisite Topics (Topic Graph Edges)
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {existingTopics
                  .filter((t) => t.id !== topic?.id)
                  .map((t) => {
                    const isSelected = selectedPrereqs.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => togglePrereq(t.id)}
                        className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          {topic && onDelete ? (
            <button
              onClick={() => {
                onDelete(topic.id);
                onClose();
              }}
              className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Topic</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl shadow-xs transition-all"
            >
              {topic ? 'Save Changes' : 'Create Topic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
