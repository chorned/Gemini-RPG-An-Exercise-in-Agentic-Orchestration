
import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700 animate-fade-in text-center">
      <h2 className="text-3xl font-bold text-amber-300 font-medieval">Welcome to the Adventure</h2>
      <p className="text-gray-300 leading-relaxed">
        This prototype is an exercise in agentic orchestration. The Large Language Model (Gemini 3 Pro) is your dungeon master, and it works together with a lore keeper agent, a rules agent, a story pacing agent, a dice rolling agent, a visualizer agent, and an optional Storyteller Agent to give you a short Dungeons & Dragons adventure with a beginning, middle, and end.
      </p>
      
      <div className="flex flex-wrap justify-center gap-4">
        {/* Portfolio Button */}
        <a href="https://horned.se" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-600 hover:border-amber-500 transition-colors font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m0 0a9 9 0 019-9m-9 9a9 9 0 009 9" />
          </svg>
          Portfolio
        </a>
        
        {/* GitHub Button */}
        <a href="https://github.com/chorned" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-600 hover:border-amber-500 transition-colors font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
          </svg>
          Github
        </a>

        {/* LinkedIn Button */}
        <a href="https://www.linkedin.com/in/carlhorned/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-600 hover:border-amber-500 transition-colors font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          LinkedIn
        </a>
      </div>

       <p className="text-gray-400">
        Hosting these projects isn't free, a donation is appreciated: 
        <a href="https://ko-fi.com/chorned" target="_blank" rel="noopener noreferrer" className="inline-flex items-center ml-2 px-3 py-1 bg-rose-800/50 border border-rose-700 rounded-full text-rose-300 hover:bg-rose-700/50 hover:border-rose-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Ko-fi
        </a>
      </p>

      <button
        onClick={onStart}
        className="w-full max-w-xs mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
      >
        Start Adventure
      </button>

      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
