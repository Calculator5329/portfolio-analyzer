import React from 'react';

interface ProgressIndicatorProps {
  step: string;
  progress: number;
  total: number;
  message: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  total,
  message
}) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="progress-indicator">
      <h3>⏳ Processing Your Portfolio...</h3>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}>
          <span className="progress-text">{percentage}%</span>
        </div>
      </div>
      <p className="progress-message">
        <strong>{message}</strong>
      </p>
      <p className="progress-details">
        Step {progress} of {total} completed
      </p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f7ff', borderRadius: '8px', fontSize: '0.9rem' }}>
        <p><strong>💡 Tip:</strong> Press F12 and check the Console tab to see detailed progress.</p>
        <p style={{ marginTop: '0.5rem' }}>Each stock requires 2 API calls with 12 seconds between them.</p>
      </div>
    </div>
  );
};

