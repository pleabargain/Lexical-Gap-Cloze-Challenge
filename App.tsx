import React, { useState, useCallback } from 'react';
import { generateGameContent, generateTopics, translateText } from './services/geminiService';
import { AppState, CEFRLevel, GameData, UserAnswers } from './types';
import { SAMPLE_TOPICS, LANGUAGES, LanguageConfig } from './constants';
import LevelSlider from './components/LevelSlider';
import GameArea from './components/GameArea';

// Icons
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 00-1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const ReloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.CONFIG);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageConfig>(LANGUAGES[0]);
  const [level, setLevel] = useState<CEFRLevel>('B2');
  const [topic, setTopic] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(SAMPLE_TOPICS);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Reference/Translation State
  const [referenceLanguage, setReferenceLanguage] = useState<string>('English');
  const [referenceText, setReferenceText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleStartGame = async () => {
    setAppState(AppState.LOADING);
    setErrorMsg('');
    try {
      const data = await generateGameContent(topic, level, selectedLanguage.name, temperature);
      setGameData(data);
      setAnswers({});
      
      // Default reference behavior
      const defaultRefLang = selectedLanguage.name === 'English' ? 'Spanish' : 'English';
      setReferenceLanguage(defaultRefLang);
      
      if (defaultRefLang === 'English') {
        setReferenceText(data.englishTranslation);
      } else {
        // If the user learns English, we can't use the default englishTranslation, so we translate
        setIsTranslating(true);
        // Reconstruct content for translation (replace blanks with answers)
        const cleanText = data.content.replace(/\{\{(\d+)\}\}/g, (_, id) => {
            const blank = data.blanks.find(b => b.id === parseInt(id));
            return blank ? blank.correctAnswer : '';
        });
        const translated = await translateText(cleanText, defaultRefLang);
        setReferenceText(translated);
        setIsTranslating(false);
      }
      
      setAppState(AppState.PLAYING);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate content. Please check your connection or API limit and try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReferenceLanguageChange = async (newLang: string) => {
    if (!gameData) return;
    setReferenceLanguage(newLang);
    
    // Use cached English translation if switching back to English
    if (newLang === 'English' && gameData.englishTranslation) {
      setReferenceText(gameData.englishTranslation);
      return;
    }

    setIsTranslating(true);
    try {
      // Reconstruct content for translation
      const cleanText = gameData.content.replace(/\{\{(\d+)\}\}/g, (_, id) => {
          const blank = gameData.blanks.find(b => b.id === parseInt(id));
          return blank ? blank.correctAnswer : '';
      });
      
      const translated = await translateText(cleanText, newLang);
      setReferenceText(translated);
    } catch (error) {
      console.error("Translation failed", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateNewTopics = async () => {
    if (!process.env.API_KEY) return;
    setIsGeneratingTopics(true);
    try {
      const newTopics = await generateTopics(temperature);
      if (newTopics.length > 0) {
        setSuggestedTopics(newTopics);
      }
    } catch (error) {
      console.error("Failed to generate topics", error);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleAnswerChange = (id: number, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckAnswers = () => {
    setAppState(AppState.RESULTS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateScore = () => {
    if (!gameData) return 0;
    let score = 0;
    gameData.blanks.forEach(b => {
      if (answers[b.id] === b.correctAnswer) score++;
    });
    return score;
  };

  const generateGmailLink = () => {
    if (!gameData) return '#';
    
    const score = calculateScore();
    const total = gameData.blanks.length;
    
    let emailBody = `My Lexical Gap Challenge Results\n\n`;
    emailBody += `Language: ${selectedLanguage.name}\n`;
    emailBody += `Topic: ${topic || 'General'}\n`;
    emailBody += `Level: ${level}\n`;
    emailBody += `Score: ${score}/${total} (${Math.round(score/total * 100)}%)\n\n`;
    emailBody += `--- Text Snippet ---\n`;
    emailBody += `${gameData.title}\n\n`;
    
    // Reconstruct text lightly for email (simplified)
    const previewText = gameData.content.replace(/\{\{(\d+)\}\}/g, (_, id) => {
        const blank = gameData.blanks.find(b => b.id === parseInt(id));
        const userVal = answers[parseInt(id)] || "[No Answer]";
        return `[${userVal}]`;
    });
    
    // Truncate if too long for URL
    const maxLength = 1500; 
    emailBody += previewText.length > maxLength 
      ? previewText.substring(0, maxLength) + "..." 
      : previewText;

    emailBody += `\n\n--- Vocabulary Notes ---\n`;
    gameData.blanks.forEach(b => {
        emailBody += `• ${b.correctAnswer}: ${b.explanation}\n`;
    });

    const subject = `${selectedLanguage.name} Lexical Challenge Result: ${score}/${total}`;
    
    // Use Gmail Web Interface URL
    return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.name === e.target.value);
    if (lang) setSelectedLanguage(lang);
  };

  const getArticle = (langName: string) => {
    // Check if the language starts with a vowel sound
    const vowelSoundLanguages = ['English', 'Italian', 'Urdu'];
    return vowelSoundLanguages.includes(langName) ? 'an' : 'a';
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lexical Gap</h1>
          </div>
          {appState !== AppState.CONFIG && (
            <button 
              onClick={() => setAppState(AppState.CONFIG)}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              New Game
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Configuration Screen */}
        {appState === AppState.CONFIG && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-100 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Configure Your Challenge</h2>
              <p className="text-slate-500">Test your command of collocations and idioms in your target language.</p>
            </div>

            <div className="space-y-8">
              
              {/* Language Selector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                  I want to learn
                </label>
                <div className="relative">
                  <select
                    value={selectedLanguage.name}
                    onChange={handleLanguageChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.name} value={lang.name}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <LevelSlider value={level} onChange={setLevel} />

              {/* Creativity / Temperature Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Topic Variety & Creativity
                  </label>
                  <span className="text-sm font-semibold text-indigo-600">
                    {(temperature * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  <span>Predictable</span>
                  <span>Balanced</span>
                  <span>Wild</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Topic (Optional)
                  </label>
                  <button 
                    onClick={handleGenerateNewTopics}
                    disabled={isGeneratingTopics || !process.env.API_KEY}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 transition-colors font-semibold"
                  >
                    <RefreshIcon className={`w-3 h-3 ${isGeneratingTopics ? 'animate-spin' : ''}`} />
                    {isGeneratingTopics ? 'Thinking...' : 'Inspire Me'}
                  </button>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Culinary Arts..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                  <div className="absolute right-2 top-2">
                     {topic === '' && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Random</span>}
                  </div>
                </div>
                
                {/* Topic Suggestions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedTopics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors text-left"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartGame}
                disabled={!process.env.API_KEY}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon />
                <span>Generate {selectedLanguage.name} Challenge</span>
              </button>
              
              {!process.env.API_KEY && (
                <p className="text-center text-red-500 text-xs mt-2">API Key missing from environment</p>
              )}
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {appState === AppState.LOADING && (
          <div className="max-w-xl mx-auto text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600 mb-6"></div>
            <h3 className="text-xl font-semibold text-slate-800">Constructing your challenge...</h3>
            <p className="text-slate-500 mt-2">Our AI linguist is preparing {getArticle(selectedLanguage.name)} {selectedLanguage.name} text at level {level}.</p>
          </div>
        )}

        {/* Error Screen */}
        {appState === AppState.ERROR && (
          <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-xl shadow p-8">
            <div className="text-red-500 mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
            <p className="text-slate-600 mb-6">{errorMsg}</p>
            <button 
              onClick={() => setAppState(AppState.CONFIG)}
              className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Game & Results Screen */}
        {(appState === AppState.PLAYING || appState === AppState.RESULTS) && gameData && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Score Banner (Only in Results) */}
            {appState === AppState.RESULTS && (
              <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Challenge Complete!</h2>
                  <p className="text-indigo-200">You scored <span className="font-bold text-white text-lg">{calculateScore()} / {gameData.blanks.length}</span></p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                  <a 
                    href={generateGmailLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors border border-indigo-500 text-white"
                  >
                    <SendIcon />
                    <span>Send via Gmail</span>
                  </a>
                  <button 
                    onClick={() => setAppState(AppState.CONFIG)}
                    className="flex items-center space-x-2 bg-white text-indigo-900 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors font-semibold"
                  >
                    <ReloadIcon />
                    <span>New Game</span>
                  </button>
                </div>
              </div>
            )}

            <GameArea 
              data={gameData}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              isReviewMode={appState === AppState.RESULTS}
              direction={selectedLanguage.direction}
              referenceText={referenceText}
              referenceLanguage={referenceLanguage}
              onReferenceLanguageChange={handleReferenceLanguageChange}
              isTranslating={isTranslating}
            />

            {/* Check Button */}
            {appState === AppState.PLAYING && (
              <div className="flex justify-center pt-4 pb-12">
                <button
                  onClick={handleCheckAnswers}
                  disabled={Object.keys(answers).length !== gameData.blanks.length}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg px-12 py-4 rounded-full shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1"
                >
                  Check Answers
                </button>
              </div>
            )}
            
            {/* Explanations (Only in Results) */}
            {appState === AppState.RESULTS && (
              <div className="max-w-7xl mx-auto mt-8 bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">Vocabulary Insights</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {gameData.blanks.map((b) => {
                    const isCorrect = answers[b.id] === b.correctAnswer;
                    return (
                      <div key={b.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isCorrect ? '✓' : '✗'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900" dir={selectedLanguage.direction}>{b.correctAnswer}</p>
                            {!isCorrect && <p className="text-sm text-red-500 mb-1" dir={selectedLanguage.direction}>You selected: {answers[b.id] || "Nothing"}</p>}
                            {/* Explanations stay in LTR (English) */}
                            <p className="text-slate-600 leading-relaxed mt-1 text-sm">{b.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
