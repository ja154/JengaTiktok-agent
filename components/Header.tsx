import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 border-b border-slate-700/50">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          JengaTiktok Agent
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Your autonomous AI assistant for scheduling content. Upload your media, set a time, and the agent handles the rest—including writing the perfect caption.
        </p>
      </div>
    </header>
  );
};

export default Header;