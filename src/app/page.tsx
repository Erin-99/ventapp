'use client';

import { useState, useEffect } from 'react';
import { translations, type Language } from '../i18n/translations';

// Get user's preferred language from browser
const getPreferredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'zh';
  
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
};

export default function Home() {
  const [complaint, setComplaint] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  // Load preferred language on mount
  useEffect(() => {
    const preferredLanguage = getPreferredLanguage();
    setLanguage(preferredLanguage);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/complain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ complaint, language }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '服务器错误');
      }

      setResponse(data.response);
      setComplaint('');
    } catch (error) {
      console.error('Error:', error);
      setResponse(error instanceof Error ? error.message : '抱歉，出了点小问题，请稍后再试~');
    } finally {
      setIsLoading(false);
    }
  };

  const switchLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-green-500">{translations[language].title}</h1>
        <button
          onClick={switchLanguage}
          className="text-green-500 hover:text-green-600 transition-colors"
        >
          {translations[language].switchLanguage}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder={translations[language].placeholder}
          className="w-full h-32 p-4 mb-4 rounded border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !complaint.trim()}
          className={`w-full p-4 rounded text-white transition-colors ${isLoading || !complaint.trim() ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {isLoading ? translations[language].loading : translations[language].submit}
        </button>
      </form>

      {response && (
        <div className="mt-8 p-4 rounded bg-gray-50 whitespace-pre-wrap">
          {response}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{translations[language].historyTitle}</h2>
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-gray-600 mb-2 text-sm">
                  {new Date(item.timestamp).toLocaleString('zh-CN')}
                </div>
                <div className="text-gray-800 mb-3">{item.complaint}</div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#07C160] rounded-full flex items-center justify-center text-white">
                    😊
                  </div>
                  <div className="flex-1 bg-[#07C160] text-white p-3 rounded-lg">
                    {item.response}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
