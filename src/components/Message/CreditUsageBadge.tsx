import React from 'react';
import './CreditUsageBadge.css';

interface CreditUsageBadgeProps {
  credit: number;
}

const CreditUsageBadge: React.FC<CreditUsageBadgeProps> = ({ credit }) => {
  if (!credit || credit <= 0) return null;

  return (
    <div className="credit-usage-badge-wrapper" title={`消費クレジット: ${credit} CR`}>
      <div className="credit-usage-badge">
        <div className="credit-usage-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="12" y1="2" x2="12" y2="6"></line>
          </svg>
        </div>
        <span className="credit-usage-value">-{credit} CR</span>
      </div>
    </div>
  );
};

export default CreditUsageBadge;
