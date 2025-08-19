import React from 'react';

interface TikTokConnectProps {
  isConnected: boolean;
  username: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const TikTokConnect: React.FC<TikTokConnectProps> = ({ isConnected, username, onConnect, onDisconnect }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 shadow-lg border border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.59-2.01-2.06-4.58-1.7-7.08.36-2.48 1.99-4.6 4.23-5.77 2.2-1.15 4.8-.93 7.08.52.57.36 1.09.78 1.62 1.22v-4.67c-.44-.34-.9-.66-1.39-.96-1.28-.78-2.8-1.07-4.29-1.07C6.01 4.26 3.65 6.22 2.44 8.52c-.42.81-.66 1.71-.82 2.63-.07.4-.18.81-.23 1.21L0 12.42c.03-.43.1-.86.19-1.28.11-.53.28-1.05.48-1.56.55-1.41 1.48-2.65 2.7-3.72C5.01 4.2 7.34 2.67 9.92 2.05c.6-.14 1.2-.24 1.8-.31.3-.04.6-.07.9-.1z" fill="currentColor"/>
        </svg>
        <div>
            <h2 className="text-lg font-bold text-white">TikTok Connection</h2>
            <p className="text-sm text-slate-400">
                {isConnected ? `Connected as ${username}` : "Connect your account to post videos."}
            </p>
        </div>
      </div>
      {isConnected ? (
        <button 
          onClick={onDisconnect}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Connect
        </button>
      )}
    </div>
  );
};

export default TikTokConnect;
