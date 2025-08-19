import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Scheduler from './components/PromptInput';
import PostList from './components/ImageDisplay';
import TikTokConnect from './components/TikTokConnect';
import * as agentService from './services/geminiService';
import { Post } from './types';


const App: React.FC = () => {
  const [tikTokApiKey, setTikTokApiKey] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const schedulerIntervalRef = useRef<number | null>(null);
  
  const fetchPosts = useCallback(async () => {
    try {
      const fetchedPosts = await agentService.getPosts();
      setPosts(fetchedPosts);
      setError(null); // Clear error on successful fetch
    } catch (err) {
      console.error("Failed to fetch posts from local storage:", err);
      setError("Could not retrieve post schedule. There might be an issue with your browser's storage.");
    }
  }, []);
  
  const runScheduler = useCallback(async () => {
    console.log('[App] Running post processing check...');
    try {
      const postsWereUpdated = await agentService.processDuePosts();
      if (postsWereUpdated) {
        console.log('[App] Posts were updated, refreshing list.');
        await fetchPosts(); // Refresh UI if any post was processed
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Scheduler failed:", err);
      setError(`An error occurred while processing scheduled posts: ${errorMessage}`);
      if (schedulerIntervalRef.current) {
        clearInterval(schedulerIntervalRef.current);
      }
    }
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts(); // Initial fetch
    
    // Run the scheduler immediately, then every 10 seconds
    runScheduler();
    schedulerIntervalRef.current = window.setInterval(runScheduler, 10000); 
    
    // Listen for changes in other tabs to keep UI in sync
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'jengaTiktokScheduledPosts') {
        fetchPosts();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (schedulerIntervalRef.current) {
        clearInterval(schedulerIntervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchPosts, runScheduler]);
  
  const handleSchedulePost = async (file: File, scheduleDate: string) => {
    if (!tikTokApiKey.trim()) {
      setError("Please provide your TikTok API key before scheduling.");
      return;
    }
    setIsScheduling(true);
    setError(null);

    try {
      await agentService.schedulePost(file, scheduleDate, tikTokApiKey);
      await fetchPosts(); // Refresh the list immediately after scheduling
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       setError(`Failed to schedule post: ${errorMessage}`);
    } finally {
        setIsScheduling(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-12">
          <TikTokConnect 
            apiKey={tikTokApiKey}
            setApiKey={setTikTokApiKey}
          />
          <Scheduler 
            onSchedule={handleSchedulePost}
            isApiKeySet={tikTokApiKey.trim() !== ''}
            isScheduling={isScheduling}
          />
          <PostList posts={posts} />
          {error && (
            <div className="fixed bottom-4 right-4 bg-red-800/90 border border-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;