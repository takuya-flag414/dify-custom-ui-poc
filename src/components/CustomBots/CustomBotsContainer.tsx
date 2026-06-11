import React from 'react';
import { CustomBotGallery } from './CustomBotGallery';
import { MockMode } from '../../config/env';
import './CustomBotsContainer.css';

interface CustomBotsContainerProps {
  onSelectBot?: (bot: any) => void;
  mockMode?: MockMode;
  apiUrl?: string;
  apiKey?: string;
  backendBApiKey?: string;
  backendBApiUrl?: string;
  currentUser?: any;
}

export const CustomBotsContainer: React.FC<CustomBotsContainerProps> = ({
  onSelectBot,
  mockMode = 'FE',
  apiUrl = '',
  apiKey = '',
  backendBApiKey = '',
  backendBApiUrl = '',
  currentUser
}) => {
  return (
    <div className="custom-bots-container glass-container animate-fade-in">
      <CustomBotGallery
        onSelectBot={onSelectBot}
        mockMode={mockMode}
        apiUrl={apiUrl}
        apiKey={apiKey}
        backendBApiKey={backendBApiKey}
        backendBApiUrl={backendBApiUrl}
        currentUser={currentUser}
      />
    </div>
  );
};
