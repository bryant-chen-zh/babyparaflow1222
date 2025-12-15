import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QuestionData } from '../../types';
import { HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionData;
  onSelectOption: (questionId: string, optionId: string) => void;
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

  // 已选择的答案（映射：questionId -> optionId[]，支持多选）
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  // 自定义文本（映射：questionId -> text）
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});

  // 当前题目
  const currentQuestion = allQuestions[currentIndex];

  // 构建当前题目的选项列表，动态添加 Other 选项
  const currentOptions = useMemo(() => {
    if (!currentQuestion) return [];
    
    const opts = [...currentQuestion.options];
    // 检查是否已经有 Other 选项
    const hasOther = opts.some(o => o.isOther || o.id === 'other');
    
    if (!hasOther) {
      opts.push({
        id: 'other',
        label: 'Other',
        isOther: true
      });
    }
    return opts;
  }, [currentQuestion]);

  // 使用 ref 标记是否已初始化，避免父组件更新时覆盖本地多选状态
  const isInitializedRef = useRef(false);

  // 初始化已选择的答案（只在首次渲染时执行）
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const initialAnswers: Record<string, string[]> = {};
    allQuestions.forEach(q => {
      if (q.selectedOptionId) {
        initialAnswers[q.questionId] = [q.selectedOptionId];
      }
    });
    if (Object.keys(initialAnswers).length > 0) {
      setSelectedAnswers(initialAnswers);
    }
    isInitializedRef.current = true;
  }, [allQuestions]);

  // 处理选项点击（多选切换）
  const handleOptionClick = (optionId: string) => {
    const questionId = currentQuestion.questionId;
    setSelectedAnswers(prev => {
      const current = prev[questionId] || [];
      const isSelected = current.includes(optionId);
      
      let updated: string[];
      if (isSelected) {
        // 取消选中
        updated = current.filter(id => id !== optionId);
      } else {
        // 添加选中
        updated = [...current, optionId];
      }
      
      return { ...prev, [questionId]: updated };
    });
    // 通知父组件
    onSelectOption(questionId, optionId);
  };

  // 处理自定义文本输入
  const handleCustomTextChange = (text: string) => {
    setCustomTexts(prev => ({ ...prev, [currentQuestion.questionId]: text }));
  };

  // 处理上一题按钮
  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 处理下一题按钮
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 最后一题，调用 Continue
      onContinue();
    }
  };

  // 折叠状态：显示答案摘要
  if (collapsed) {
    return (
      <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg mb-4 p-3">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="text-moxt-brand-7" size={14} />
          <span className="text-13 font-semibold text-moxt-text-1">Answers Summary</span>
        </div>
        <div className="space-y-1.5">
          {allQuestions.map((q, index) => {
            const selectedIds = selectedAnswers[q.questionId] || [];
            let answerLabel = 'Skipped';
            
            if (selectedIds.length > 0) {
              const labels = selectedIds.map(id => {
                if (id === 'other') {
                  return customTexts[q.questionId] || 'Other';
                }
                const opt = q.options.find(o => o.id === id);
                return opt?.label || id;
              });
              answerLabel = labels.join(', ');
            }

            return (
              <div key={q.questionId} className="text-13 text-moxt-text-2">
                <span className="font-medium text-moxt-text-1">Question {index + 1}/{totalQuestions}:</span> {answerLabel}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="bg-moxt-fill-white border border-moxt-line-1 rounded-lg max-w-[96%] mb-4 flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-moxt-line-1">
        <HelpCircle className="text-moxt-brand-7" size={14} />
        <span className="text-13 font-semibold text-moxt-text-1">Questions</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="mb-3">
          <h3 className="text-13 font-medium text-moxt-text-1 mb-1">
            <span className="font-bold">{currentIndex + 1}.</span> {currentQuestion.questionText}
          </h3>
        </div>

        <div className="space-y-1.5">
          {currentOptions.map((option, index) => {
            const currentSelected = selectedAnswers[currentQuestion.questionId] || [];
            const isSelected = currentSelected.includes(option.id);
            const isOther = option.isOther || option.id === 'other';
            const label = String.fromCharCode(65 + index); // A, B, C...

            return (
              <div key={option.id} className="group">
                <button
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all flex items-center gap-2.5 border ${
                    isSelected
                      ? 'bg-moxt-fill-2 text-moxt-text-1 border-moxt-line-2'
                      : 'bg-transparent text-moxt-text-2 hover:bg-moxt-fill-1 border-transparent'
                  }`}
                >
                  <span className={`text-12 font-bold ${isSelected ? 'text-moxt-text-1' : 'text-moxt-text-4'}`}>
                    {label}
                  </span>
                  
                  <div className="flex-1">
                    <span className="text-12">{option.label}</span>
                    {option.description && (
                      <span className="text-12 text-moxt-text-3 ml-2">
                        - {option.description}
                      </span>
                    )}
                  </div>
                </button>

                {/* Other Input */}
                {isOther && isSelected && (
                  <div className="ml-8 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="text"
                      value={customTexts[currentQuestion.questionId] || ''}
                      onChange={(e) => handleCustomTextChange(e.target.value)}
                      placeholder="Please specify..."
                      className="w-full px-2.5 py-1.5 text-12 bg-white border border-moxt-line-2 rounded-md focus:outline-none focus:border-moxt-text-2 focus:ring-1 focus:ring-moxt-text-2 transition-all"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Pagination & Navigation */}
      <div className="px-3 py-2.5 border-t border-moxt-line-1 flex items-center justify-between bg-white rounded-b-lg">
        {/* Left button: Skip all (first question) or Back (other questions) */}
        {currentIndex === 0 ? (
          <button
            onClick={onSkip}
            className="px-3 py-1.5 text-12 font-medium rounded-md transition-colors text-moxt-text-3 hover:text-moxt-text-1 hover:bg-moxt-fill-1"
          >
            Skip all
          </button>
        ) : (
          <button
            onClick={handleBack}
            className="px-3 py-1.5 text-12 font-medium rounded-md transition-colors text-moxt-text-3 hover:text-moxt-text-1 hover:bg-moxt-fill-1"
          >
            Back
          </button>
        )}

        {/* Pagination Dots - Clickable */}
        <div className="flex items-center gap-1.5">
          {allQuestions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full hover:scale-125 ${
                idx === currentIndex
                  ? 'w-4 h-1.5 bg-moxt-text-2'
                  : 'w-1.5 h-1.5 bg-moxt-line-2 hover:bg-moxt-text-3'
              }`}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>

        {/* Right button: Submit (last question) or Next (other questions) */}
        <button
          onClick={handleNext}
          className="px-3 py-1.5 text-12 font-semibold text-white bg-moxt-brand-7 hover:opacity-90 rounded-md transition-colors shadow-sm"
        >
          {currentIndex === totalQuestions - 1 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
