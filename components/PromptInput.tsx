import React from 'react';
import Spinner from './Spinner';

interface PromptInputProps {
  instruction: string;
  setInstruction: (value: string) => void;
  onExecute: () => void;
  isRunning: boolean;
  isTikTokConnected: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ instruction, setInstruction, onExecute, isRunning, isTikTokConnected }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onExecute();
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg border border-slate-700">
        <label htmlFor="prompt-input" className="block text-lg font-medium text-slate-300 mb-3">
          Enter your instruction for the agent
        </label>
        <div className="relative">
          <textarea
            id="prompt-input"
            rows={3}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none placeholder-slate-500"
            placeholder="e.g., Create a video of a golden retriever surfing and post it to my TikTok"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
          />
        </div>
        <button
          onClick={onExecute}
          disabled={isRunning || !instruction.trim() || !isTikTokConnected}
          className="mt-4 w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          {isRunning ? <Spinner /> : 'Execute Task'}
        </button>
        {!isTikTokConnected && (
            <p className="text-center text-yellow-400 text-sm mt-3">
                Please connect your TikTok account to enable the agent.
            </p>
        )}
    </div>
  );
};

export default PromptInput;