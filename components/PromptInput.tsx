import React, { useState, useCallback } from 'react';
import Spinner from './Spinner';

interface SchedulerProps {
  onSchedule: (file: File, scheduleDate: string) => void;
  isApiKeySet: boolean;
  isScheduling: boolean;
}

const Scheduler: React.FC<SchedulerProps> = ({ onSchedule, isApiKeySet, isScheduling }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
          setError('File size must not exceed 50MB.');
          return;
      }
      setError(null);
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };
  
  const handleScheduleClick = () => {
      if (!file || !scheduleDate) {
          setError('Please select a file and a schedule date.');
          return;
      }
      if (new Date(scheduleDate) <= new Date()) {
          setError('Schedule date must be in the future.');
          return;
      }
      setError(null);
      onSchedule(file, scheduleDate);
      // Reset form after scheduling
      setFile(null);
      setPreviewUrl(null);
      setScheduleDate('');
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Set minimum time to 1 minute in the future
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold text-slate-200 mb-4">Schedule a New Post</h2>
      
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* File Upload and Preview */}
        <div className="flex flex-col items-center justify-center bg-slate-900/50 border-2 border-dashed border-slate-600 rounded-lg p-4 h-full">
            {previewUrl ? (
                <div className="relative w-full h-full max-h-64">
                    {file?.type.startsWith('video/') ? (
                        <video src={previewUrl} controls className="w-full h-full object-contain rounded-md" />
                    ) : (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-md" />
                    )}
                    <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs">&times;</button>
                </div>
            ) : (
                <div className="text-center">
                    <label htmlFor="file-upload" className="cursor-pointer text-purple-400 hover:text-purple-500 font-medium">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/mp4,video/quicktime" />
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Image or Video (Max 50MB)</p>
                </div>
            )}
        </div>

        {/* Scheduling Controls */}
        <div className="flex flex-col gap-4">
             <div>
                <label htmlFor="schedule-date" className="block text-sm font-medium text-slate-300 mb-2">
                    Date and Time to Post
                </label>
                <input
                    type="datetime-local"
                    id="schedule-date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={getMinDateTime()}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
            </div>

            <button
                onClick={handleScheduleClick}
                disabled={isScheduling || !file || !scheduleDate || !isApiKeySet}
                className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                >
                {isScheduling ? <Spinner /> : 'Schedule Post'}
            </button>
            {!isApiKeySet && (
                <p className="text-center text-yellow-400 text-sm">
                    Please provide your TikTok API key to enable scheduling.
                </p>
            )}
            {error && <p className="text-center text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Scheduler;