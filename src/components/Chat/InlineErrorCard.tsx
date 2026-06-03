import React from 'react';
import { useCredit } from '../../contexts/CreditContext';
import './InlineErrorCard.css';

interface InlineErrorCardProps {
  message?: string;
}

const InlineErrorCard: React.FC<InlineErrorCardProps> = ({ message = "クレジット残高が不足しています" }) => {
  const { nextResetDate } = useCredit();

  return (
    <div className="inline-error-card">
      <div className="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div className="error-content">
        <span className="error-message">{message}</span>
        <span className="error-sub-message">
          次回リセット（{nextResetDate}）をお待ちいただくか、管理者に上限の引き上げを申請してください。
        </span>
      </div>
    </div>
  );
};

export default InlineErrorCard;
