import React, { useState } from 'react';

interface APIKeyInputProps {
  onAPIKeySubmit: (apiKey: string) => void;
  disabled?: boolean;
}

export const APIKeyInput: React.FC<APIKeyInputProps> = ({ onAPIKeySubmit, disabled }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onAPIKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="api-key-input">
      <h3>Enter Alpha Vantage API Key</h3>
      <p className="hint">
        Get your free API key at{' '}
        <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer">
          alphavantage.co
        </a>
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          disabled={disabled}
          className="api-input"
        />
        <button type="submit" disabled={disabled || !apiKey.trim()} className="submit-button">
          Start Analysis
        </button>
      </form>
    </div>
  );
};

