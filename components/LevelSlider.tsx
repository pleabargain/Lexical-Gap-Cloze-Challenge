import React from 'react';
import { CEFRLevel } from '../types';
import { LEVELS, LEVEL_DESCRIPTIONS } from '../constants';

interface LevelSliderProps {
  value: CEFRLevel;
  onChange: (level: CEFRLevel) => void;
}

const LevelSlider: React.FC<LevelSliderProps> = ({ value, onChange }) => {
  const currentIndex = LEVELS.indexOf(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    onChange(LEVELS[index]);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Select Difficulty
        </label>
        <span className="text-sm font-semibold text-indigo-600">
          {value}
        </span>
      </div>
      
      <input
        type="range"
        min="0"
        max={LEVELS.length - 1}
        step="1"
        value={currentIndex}
        onChange={handleChange}
        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="flex justify-between mt-2 px-1">
        {LEVELS.map((level) => (
          <div 
            key={level} 
            className={`flex flex-col items-center cursor-pointer transition-colors ${level === value ? 'text-indigo-700' : 'text-slate-400'}`}
            onClick={() => onChange(level)}
          >
            <span className="text-xs font-bold">{level}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center h-6">
        <span className="text-sm text-slate-500 italic transition-opacity duration-300">
          {LEVEL_DESCRIPTIONS[value]}
        </span>
      </div>
    </div>
  );
};

export default LevelSlider;
