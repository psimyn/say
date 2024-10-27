import React from 'react';

interface ProgressProps {
  progress: {
    status: string;
    progress?: number;
  };
}

export const Progress: React.FC<ProgressProps> = ({ progress }) => {
  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 mb-1">{progress.status}</div>
      {progress.progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.round(progress.progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Progress;
