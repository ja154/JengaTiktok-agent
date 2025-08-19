import React from 'react';
import Spinner from './Spinner';
import { AgentResult } from '../App';

interface AgentStatusDisplayProps {
  logs: string[];
  isRunning: boolean;
  error: string | null;
  result: AgentResult | null;
}

const AgentStatusDisplay: React.FC<AgentStatusDisplayProps> = ({ 
  logs,
  isRunning,
  error,
  result
}) => {
  
  const LogDisplay = () => (
    <div className="w-full bg-slate-900/70 rounded-lg p-4 border border-slate-700 font-mono text-sm">
      {logs.map((log, index) => (
        <p key={index} className={`whitespace-pre-wrap ${log.startsWith('✖') ? 'text-red-400' : log.startsWith('✅') ? 'text-green-400' : 'text-slate-400'}`}>
          {log}
        </p>
      ))}
      {isRunning && <div className="flex items-center text-cyan-400 mt-2"><Spinner />Thinking...</div>}
    </div>
  );

  const ResultDisplay = () => {
    if (!result) return null;

    return (
      <div className="w-full flex flex-col gap-6 mt-4">
          <h2 className="text-2xl font-bold text-center text-green-400">Task Completed</h2>
          <div className="flex-shrink-0 relative">
            {result.mediaType === 'image' ? (
              <img 
                src={result.mediaUrl} 
                alt={result.detailedPrompt || 'Generated AI image'} 
                className="rounded-lg shadow-2xl object-cover w-full h-auto aspect-square"
              />
            ) : (
              <video 
                src={result.mediaUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="rounded-lg shadow-2xl object-cover w-full h-auto aspect-square"
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
             <div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">Final Caption</h3>
                <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700">
                    <p className="text-slate-300 whitespace-pre-wrap">{result.caption}</p>
                </div>
            </div>
            <a 
              href={result.mediaUrl}
              download={`ai-generated.${result.mediaType === 'image' ? 'jpg' : 'mp4'}`}
              className="flex-1 text-center bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
            >
              Download Media
            </a>
          </div>
        </div>
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg border border-slate-700 min-h-[400px] flex flex-col items-center justify-center">
      {logs.length === 0 && (
        <div className="text-center text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="mt-2 text-xl">Agent is standing by.</p>
            <p className="text-slate-400">Awaiting your instructions.</p>
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Agent Status</h2>
            <LogDisplay />
            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mt-4 w-full">{error}</div>}
            {result && <ResultDisplay />}
        </div>
      )}
    </div>
  );
};

export default AgentStatusDisplay;