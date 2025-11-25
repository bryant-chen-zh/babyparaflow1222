import React, { useState, useEffect, useRef } from 'react';
import { QuestionData } from '../../types';
import { HelpCircle, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionData;
  onSelectOption: (optionId: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  collapsed?: boolean;
}

export function QuestionCard({ question, onSelectOption, onSkip, onContinue, collapsed = false }: QuestionCardProps) {
  // 使用 allQuestions 支持多题模式
  const allQuestions = question.allQuestions || [question];
  const totalQuestions = allQuestions.length;

  // 当前题目索引（内部状态）
  const [currentIndex, setCurrentIndex] = useState(0);

  // 已选择的答案（映射：questionId -> optionId）
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // 为每个题目创建 ref
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 初始化已选择的答案
  useEffect(() => {
    const initialAnswers: Record<string, string> = {};
    allQuestions.forEach(q => {
      if (q.selectedOptionId) {
        initialAnswers[q.questionId] = q.selectedOptionId;
      }
    });
    setSelectedAnswers(initialAnswers);
  }, []);

  // 滚动到指定题目
  const scrollToQuestion = (index: number) => {
    const targetRef = questionRefs.current[index];
    if (targetRef && scrollContainerRef.current) {
      targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 处理选项点击
  const handleOptionClick = (questionId: string, optionId: string) => {
    // 更新本地状态
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));

    // 通知父组件
    onSelectOption(optionId);

    // 找到当前题目的索引
    const currentQuestionIndex = allQuestions.findIndex(q => q.questionId === questionId);

    // 如果不是最后一题，自动滚动到下一题
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentIndex(nextIndex);
        scrollToQuestion(nextIndex);
      }, 300);
    } else {
      // 最后一题，更新当前索引
      setCurrentIndex(currentQuestionIndex);
    }
  };

  // 处理上一题按钮
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollToQuestion(newIndex);
    }
  };

  // 处理下一题按钮
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollToQuestion(newIndex);
    }
  };

  // 折叠状态：显示答案摘要
  if (collapsed) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-[96%] mb-4 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Question Answers</span>
        </div>
        <div className="space-y-2">
          {allQuestions.map((q, index) => {
            const selectedOption = q.options.find(opt => opt.id === selectedAnswers[q.questionId]);
            return (
              <div key={q.questionId} className="text-sm text-slate-600">
                <div className="font-medium text-slate-700">
                  问题 {index + 1}/{totalQuestions}: {q.questionText}
                </div>
                {selectedOption && (
                  <div className="text-slate-500 mt-0.5">
                    {selectedOption.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-[96%] mb-4 flex flex-col" style={{ maxHeight: '70vh' }}>
      {/* Header: Questions title and page navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Questions</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              currentIndex === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium min-w-[3rem] text-center">
            {currentIndex + 1} of {totalQuestions}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              currentIndex === totalQuestions - 1
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Questions Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {allQuestions.map((q, qIndex) => {
          const isCurrentQuestion = qIndex === currentIndex;
          const isAnswered = !!selectedAnswers[q.questionId];
          const selectedId = selectedAnswers[q.questionId];

          return (
            <div
              key={q.questionId}
              ref={el => (questionRefs.current[qIndex] = el)}
              className="space-y-3"
            >
              {/* Question Title */}
              <div className="flex items-start gap-2">
                <div className={`text-sm font-medium transition-colors ${
                  isCurrentQuestion ? 'text-slate-900' : isAnswered ? 'text-slate-500' : 'text-slate-700'
                }`}>
                  <span className="font-bold">{qIndex + 1}.</span> {q.questionText}
                </div>
                {isAnswered && (
                  <div className="flex-shrink-0">
                    <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  </div>
                )}
              </div>

              {/* Options list - No indent, same alignment as question */}
              <div className="space-y-2">
                {q.options.map((option, index) => {
                  const isSelected = selectedId === option.id;
                  const label = optionLabels[index] || String.fromCharCode(65 + index);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(q.questionId, option.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 border ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-transparent text-slate-700 hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {label}
                      </span>
                      <span className="text-sm">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 bg-white">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            Continue
            <span className="text-white">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
