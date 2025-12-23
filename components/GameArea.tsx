import React, { useMemo } from 'react';
import { GameData, UserAnswers } from '../types';
import { LANGUAGES } from '../constants';

interface GameAreaProps {
  data: GameData;
  answers: UserAnswers;
  onAnswerChange: (id: number, value: string) => void;
  isReviewMode: boolean;
  direction: 'ltr' | 'rtl';
  referenceText: string;
  referenceLanguage: string;
  onReferenceLanguageChange: (lang: string) => void;
  isTranslating: boolean;
}

const GameArea: React.FC<GameAreaProps> = ({ 
  data, 
  answers, 
  onAnswerChange, 
  isReviewMode, 
  direction,
  referenceText,
  referenceLanguage,
  onReferenceLanguageChange,
  isTranslating
}) => {
  
  // Parse content to split by {{id}}
  const contentParts = useMemo(() => {
    const parts: Array<string | number> = [];
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(data.content)) !== null) {
      // Push text before the match
      if (match.index > lastIndex) {
        parts.push(data.content.substring(lastIndex, match.index));
      }
      // Push the ID
      parts.push(parseInt(match[1], 10));
      lastIndex = regex.lastIndex;
    }
    // Push remaining text
    if (lastIndex < data.content.length) {
      parts.push(data.content.substring(lastIndex));
    }
    return parts;
  }, [data.content]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Exercise */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-slate-200 flex flex-col h-full">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-6" dir={direction}>
            <h2 className="text-2xl font-bold text-slate-900 font-serif-text leading-tight">
              {data.title}
            </h2>
            <div className="mt-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">Exercise</div>
          </div>
          
          <div 
            className="px-8 py-8 md:py-10 text-lg md:text-xl leading-relaxed text-slate-800 font-serif-text flex-grow"
            dir={direction}
          >
            {contentParts.map((part, index) => {
              if (typeof part === 'string') {
                return <span key={`text-${index}`} dangerouslySetInnerHTML={{__html: part.replace(/\n/g, '<br/><br/>')}} />;
              } else {
                const blankId = part;
                const blankData = data.blanks.find(b => b.id === blankId);
                const userAnswer = answers[blankId];
                
                if (!blankData) return null;

                const isCorrect = isReviewMode && userAnswer === blankData.correctAnswer;
                const isWrong = isReviewMode && userAnswer !== blankData.correctAnswer;
                
                let statusClasses = "border-slate-300 bg-slate-50 text-slate-700 hover:border-indigo-400";
                if (isCorrect) statusClasses = "border-green-500 bg-green-50 text-green-900 font-bold";
                if (isWrong) statusClasses = "border-red-400 bg-red-50 text-red-900 line-through decoration-2";

                // If reviewing and wrong, show correct answer next to it
                const correction = (isReviewMode && isWrong) ? (
                  <span className="mx-1 text-green-700 font-bold text-base bg-green-100 px-1 rounded">
                    {blankData.correctAnswer}
                  </span>
                ) : null;

                return (
                  <span key={`blank-${blankId}`} className="inline-block align-baseline mx-1 my-1">
                    <select
                      disabled={isReviewMode}
                      value={userAnswer || ""}
                      onChange={(e) => onAnswerChange(blankId, e.target.value)}
                      className={`
                        appearance-none cursor-pointer
                        py-1 px-3 pr-8 rounded-md border-b-2 
                        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500
                        min-w-[120px] text-base font-sans
                        ${statusClasses}
                      `}
                      style={{ backgroundImage: isReviewMode ? 'none' : undefined }}
                    >
                      <option value="" disabled>...</option>
                      {blankData.options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {correction}
                  </span>
                );
              }
            })}
          </div>
        </div>

        {/* Right Column: Translation/Reference */}
        <div className="bg-slate-50 shadow-inner rounded-lg overflow-hidden border border-slate-200 flex flex-col h-full min-h-[400px]">
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference Translation</div>
             <div className="relative">
               <select
                 value={referenceLanguage}
                 onChange={(e) => onReferenceLanguageChange(e.target.value)}
                 disabled={isTranslating}
                 className="text-sm bg-white border border-slate-300 text-slate-700 py-1 pl-3 pr-8 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
               >
                 {LANGUAGES.map(lang => (
                   <option key={lang.name} value={lang.name}>{lang.name}</option>
                 ))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
               </div>
             </div>
          </div>
          
          <div className="px-6 py-8 md:py-10 text-base md:text-lg leading-relaxed text-slate-600 font-serif-text flex-grow relative">
            {isTranslating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
                <div className="flex flex-col items-center">
                   <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                   <span className="text-sm text-indigo-600 font-medium">Translating...</span>
                </div>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{__html: referenceText.replace(/\n/g, '<br/><br/>')}} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GameArea;
