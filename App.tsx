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
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResult | null>(null);

  const [isTikTokConnected, setIsTikTokConnected] = useState<boolean>(false);
  const [tikTokUser, setTikTokUser] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };
  
  const handleExecuteTask = useCallback(async () => {
    if (!instruction.trim() || isRunning) return;

    setIsRunning(true);
    setError(null);
    setResult(null);
    setLogs(['▶ Agent task started...']);

    try {
      addLog('Step 1/5: Analyzing instruction...');
      const plan = await agentService.planInstruction(instruction);
      addLog(`-> Plan: Create a ${plan.mediaType} of "${plan.subject}"`);

      addLog('Step 2/5: Engineering detailed prompt...');
      const { detailedPrompt } = await agentService.engineerPrompt(plan.subject);
      addLog('-> Prompt engineered successfully.');

      addLog('Step 3/5: Generating media... (this may take a minute)');
      const { mediaUrl } = await agentService.generateMedia(detailedPrompt, plan.mediaType);
      addLog('-> Media generated!');

      addLog('Step 4/5: Writing a viral caption...');
      const { caption } = await agentService.generateCaption(detailedPrompt);
      addLog('-> Caption ready.');

      addLog('Step 5/5: Posting to TikTok...');
      await agentService.postToTikTok(mediaUrl, caption, plan.mediaType);
      addLog('-> Successfully posted to TikTok! (Simulated)');

      setResult({ mediaUrl, caption, mediaType: plan.mediaType, detailedPrompt });
      addLog('✅ Agent task finished!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Task failed: ${errorMessage}`);
      addLog(`✖ Task failed. ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  }, [instruction, isRunning]);
  
  const handleTikTokConnect = () => {
    setIsTikTokConnected(true);
    setTikTokUser("@your_username"); 
  };

  const handleTikTokDisconnect = () => {
    setIsTikTokConnected(false);
    setTikTokUser(null);
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-12">
          <TikTokConnect 
            isConnected={isTikTokConnected}
            username={tikTokUser}
            onConnect={handleTikTokConnect}
            onDisconnect={handleTikTokDisconnect}
          />
          <PromptInput
            instruction={instruction}
            setInstruction={setInstruction}
            onExecute={handleExecuteTask}
            isRunning={isRunning}
            isTikTokConnected={isTikTokConnected}
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