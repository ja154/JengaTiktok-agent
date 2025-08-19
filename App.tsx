import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import AgentStatusDisplay from './components/ImageDisplay';
import TikTokConnect from './components/TikTokConnect';
import * as agentService from './services/geminiService';

export type GenerationType = 'image' | 'video';

export interface AgentResult {
  mediaUrl: string;
  mediaType: GenerationType;
  caption: string;
  detailedPrompt: string;
}

const App: React.FC = () => {
  const [instruction, setInstruction] = useState<string>('');
  const [tikTokApiKey, setTikTokApiKey] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);
  
  const handleExecuteTask = useCallback(async () => {
    if (!instruction.trim() || isRunning || !tikTokApiKey.trim()) return;

    setIsRunning(true);
    setError(null);
    setResult(null);
    setLogs([]);

    try {
      const stream = agentService.executeAutonomousAgent(instruction, tikTokApiKey);

      for await (const event of stream) {
        switch (event.type) {
          case 'log':
            setLogs(prev => [...prev, event.message]);
            break;
          case 'result':
            setResult(event.payload);
            setLogs(prev => [...prev, '✅ Agent task finished!']);
            break;
          case 'error':
            const errorMessage = `Task failed: ${event.message}`;
            setError(errorMessage);
            setLogs(prev => [...prev, `✖ ${errorMessage}`]);
            break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during the streaming connection.';
      setError(`Connection failed: ${errorMessage}`);
      setLogs(prev => [...prev, `✖ Connection failed. ${errorMessage}`]);
    } finally {
      setIsRunning(false);
    }
  }, [instruction, isRunning, tikTokApiKey]);
  
  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-12">
          <TikTokConnect 
            apiKey={tikTokApiKey}
            setApiKey={setTikTokApiKey}
          />
          <PromptInput
            instruction={instruction}
            setInstruction={setInstruction}
            onExecute={handleExecuteTask}
            isRunning={isRunning}
            isApiKeySet={tikTokApiKey.trim() !== ''}
          />
          <AgentStatusDisplay
            logs={logs}
            isRunning={isRunning}
            error={error}
            result={result}
          />
        </div>
      </main>
    </div>
  );
};

export default App;