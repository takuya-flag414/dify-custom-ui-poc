// src/components/Chat/HistorySkeleton.jsx
import React from 'react';
import { AssistantIcon } from '../Message/MessageBlock';
import SkeletonLoader from '../Message/SkeletonLoader';
import '../Message/MessageBlock.css';

const HistorySkeleton = ({ userName }) => {
  // 1ターンのみ表示
  const dummyItems = [1];

  return (
    <div className="chat-history" style={{ paddingBottom: '20px', overflow: 'hidden' }}>
      {dummyItems.map((item) => (
        <React.Fragment key={item}>
          {/* Mock User Message (Right) */}
          <div className="message-block">
            <div className="message-container message-container-user">
              <div className="avatar-user">{userName?.charAt(0).toUpperCase() || 'U'}</div>
              <div className="message-content message-content-user">
                <div className="message-bubble-row" style={{ justifyContent: 'flex-end' }}>
                  <div className="message-bubble user-bubble" style={{ width: '240px', opacity: 0.6 }}>
                    <div style={{ height: '14px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mock AI Message (Left) */}
          <div className="message-block">
            <div className="message-container">
              <div className="avatar-ai">
                <AssistantIcon />
              </div>
              <div className="message-content">
                <div className="message-bubble-row">
                  <div className="message-bubble ai-bubble" style={{ width: '100%' }}>
                    <SkeletonLoader />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default HistorySkeleton;