'use client';

import { useState, useEffect } from 'react';
import { translations, type Language } from '../i18n/translations';

// Get user's preferred language from browser
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const savedLang = localStorage.getItem('language') as Language;
  if (savedLang && (savedLang === 'en' || savedLang === 'zh')) return savedLang;
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [complaint, setComplaint] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{complaint: string; response: string; timestamp: string}>>([]);

  useEffect(() => {
    setLanguage(getInitialLanguage());
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('complaints');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSubmit = async () => {
    if (!complaint.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/complain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ complaint, language }),
      });
      
      const data = await res.json();
      setResponse(data.response);
      
      // Save to localStorage
      const history = JSON.parse(localStorage.getItem('complaints') || '[]');
      history.unshift({ complaint, response: data.response, timestamp: new Date().toISOString() });
      localStorage.setItem('complaints', JSON.stringify(history.slice(0, 50))); // Keep last 50 complaints
      
      // Clear the complaint input
      setComplaint('');
    } catch (error) {
      console.error('Error:', error);
      setResponse(translations[language].errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EDEDED] p-4 flex flex-col max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#07C160]">{translations[language].title}</h1>
        <button
          onClick={toggleLanguage}
          className="text-[#07C160] hover:underline"
        >
          {translations[language].languageSwitch}
        </button>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <textarea
          className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#07C160]"
          placeholder={translations[language].inputPlaceholder}
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
        />
        
        <button
          onClick={handleSubmit}
          disabled={isLoading || !complaint.trim()}
          className={`w-full mt-4 py-2 px-4 rounded-lg text-white font-medium
            ${isLoading || !complaint.trim() 
              ? 'bg-gray-300' 
              : 'bg-[#07C160] hover:bg-[#06B057]'
            }`}
        >
          {isLoading ? translations[language].thinking : translations[language].submitButton}
        </button>
      </div>

      {response && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-[#07C160] rounded-full flex items-center justify-center text-white">
              😊
            </div>
            <div className="flex-1 bg-[#07C160] text-white p-3 rounded-lg">
              {response}
            </div>
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
