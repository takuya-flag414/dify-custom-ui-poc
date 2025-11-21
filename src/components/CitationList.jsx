// src/components/CitationList.jsx
import React from 'react';
import './styles/CitationList.css';
// ★修正: 統合コンポーネントをインポート
import { SourceIcon } from './FileIcons';

const CitationList = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="citation-container">
      <div className="citation-label">出典</div>
      <div className="citation-list">
        {citations.map((cite, index) => {
          const Wrapper = cite.url ? 'a' : 'div';
          const props = cite.url 
            ? { href: cite.url, target: '_blank', rel: 'noopener noreferrer' } 
            : {};

          return (
            <Wrapper 
              key={cite.id || index} 
              className="citation-item" 
              {...props}
            >
              {/* ★修正: SourceIconを使用 */}
              <div className="citation-icon-wrapper">
                <SourceIcon type={cite.type} source={cite.source} />
              </div>
              
              <span className="citation-source" title={cite.source}>
                {cite.source}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
};

export default CitationList;