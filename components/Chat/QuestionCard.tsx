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
      <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg max-w-[96%] mb-4 p-3">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="text-moxt-brand-7" size={14} />
          <span className="text-13 font-semibold text-moxt-text-1">Answers Summary</span>
        </div>
        <div className="space-y-1.5">
          {allQuestions.map((q, index) => {
            const selectedOption = q.options.find(opt => opt.id === selectedAnswers[q.questionId]);
            return (
              <div key={q.questionId} className="text-12 text-moxt-text-2">
                <span className="font-medium text-moxt-text-1">Question {index + 1}/{totalQuestions}:</span> {selectedOption?.label || 'Skipped'}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg max-w-[96%] mb-4 flex flex-col" style={{ maxHeight: '40vh' }}>
      {/* Header: Questions title and page navigation */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-moxt-line-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-moxt-brand-7" size={14} />
          <span className="text-13 font-semibold text-moxt-text-1">Questions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              currentIndex === 0
                ? 'text-moxt-text-4 cursor-not-allowed'
                : 'text-moxt-text-2 hover:bg-moxt-fill-1'
            }`}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-12 text-moxt-text-3 font-medium min-w-[2.5rem] text-center">
            {currentIndex + 1}/{totalQuestions}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              currentIndex === totalQuestions - 1
                ? 'text-moxt-text-4 cursor-not-allowed'
                : 'text-moxt-text-2 hover:bg-moxt-fill-1'
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Questions Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {allQuestions.map((q, qIndex) => {
          const isCurrentQuestion = qIndex === currentIndex;
          const isAnswered = !!selectedAnswers[q.questionId];
          const selectedId = selectedAnswers[q.questionId];

          return (
            <div
              key={q.questionId}
              ref={el => (questionRefs.current[qIndex] = el)}
              className="space-y-2"
            >
              {/* Question Title */}
              <div className="flex items-start gap-2">
                <div className={`text-13 font-medium transition-colors ${
                  isCurrentQuestion ? 'text-moxt-text-1' : isAnswered ? 'text-moxt-text-3' : 'text-moxt-text-2'
                }`}>
                  <span className="font-bold">{qIndex + 1}.</span> {q.questionText}
                </div>
                {isAnswered && (
                  <div className="flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-moxt-text-3 mt-0.5" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Options list - No indent, same alignment as question */}
              <div className="space-y-1.5">
                {q.options.map((option, index) => {
                  const isSelected = selectedId === option.id;
                  const label = optionLabels[index] || String.fromCharCode(65 + index);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(q.questionId, option.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all flex items-center gap-2.5 border ${
                        isSelected
                          ? 'bg-moxt-fill-2 text-moxt-text-1 border-moxt-line-2'
                          : 'bg-transparent text-moxt-text-2 hover:bg-moxt-fill-1 border-transparent'
                      }`}
                    >
                      <span className={`text-12 font-bold ${isSelected ? 'text-moxt-text-1' : 'text-moxt-text-4'}`}>
                        {label}
                      </span>
                      <span className="text-12">
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
      <div className="flex-shrink-0 border-t border-moxt-line-1 px-3 py-2.5 bg-moxt-fill-white">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onSkip}
            className="px-3 py-1.5 text-12 font-medium text-moxt-text-3 hover:text-moxt-text-1 hover:bg-moxt-fill-1 rounded-md transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onContinue}
            className="px-3 py-1.5 text-12 font-semibold text-white bg-moxt-brand-7 hover:opacity-90 rounded-md transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
