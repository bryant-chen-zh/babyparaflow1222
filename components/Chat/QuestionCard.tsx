import React, { useState, useEffect } from 'react';
import { QuestionData } from '../../types';
import { HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionData;
  onSelectOption: (optionId: string) => void;
  onSkip: () => void;
  onContinue: () => void;
}

export function QuestionCard({ question, onSelectOption, onSkip, onContinue }: QuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(question.selectedOptionId);

  // 当问题改变时重置选择状态
  useEffect(() => {
    setSelectedId(question.selectedOptionId);
  }, [question.questionId, question.selectedOptionId]);

  const handleOptionClick = (optionId: string) => {
    setSelectedId(optionId);
    onSelectOption(optionId);

    // 选择后自动切换到下一题（延迟300ms以显示选中效果）
    setTimeout(() => {
      onContinue();
    }, 300);
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 max-w-[85%] mb-4">
      {/* Header: Questions title and page number */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Key Questions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {question.currentPage} / {question.totalPages}
          </span>
        </div>
      </div>

      {/* Question text */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Question {question.currentPage}
        </div>
        <div className="text-sm font-medium leading-relaxed text-slate-700">
          {question.questionText}
        </div>
      </div>

      {/* Options list */}
      <div className="space-y-2 mb-3">
        {question.options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const label = optionLabels[index] || String.fromCharCode(65 + index);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Option label */}
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </div>

                {/* Option content */}
                <div className="flex-1 pt-0.5">
                  <div className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint text */}
      <div className="text-xs text-slate-400 text-center mt-3">
        Click an option to proceed to the next question
      </div>
    </div>
  );
}
