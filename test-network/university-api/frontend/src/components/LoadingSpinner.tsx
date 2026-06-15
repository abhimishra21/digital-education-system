import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 16, text = 'Loading...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      justifyContent: 'center'
    }}>
      <RefreshCw size={size} className="animate-spin" />
      {text && <span>{text}</span>}
    </div>
  );
};

export default LoadingSpinner; 