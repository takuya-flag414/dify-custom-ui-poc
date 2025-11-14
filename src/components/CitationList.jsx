// src/components/CitationList.jsx
import React from 'react';
import './styles/MessageBlock.css';

/**
 * 出典リスト表示 (T-09, P-3)
 * @param {Array} citations - 出典情報の配列 (T-09)
 */
const CitationList = ({ citations }) => {
  if (!citations || citations.length === 0) {
    return null; // 出典がなければ何も表示しない
  }

  // T-03時点のダミー表示
  // TODO: T-09で Dify API (message_end) の形式に合わせて修正
  const dummyCitations = [
    { id: '1', type: 'file', source: 'dify-docs.pdf (P.5)' },
    { id: '2', type: 'web', source: 'https://docs.dify.ai/api/', url: 'https://docs.dify.ai/api/' },
  ];

  return (
    <div className="citation-list">
      <h4 className="citation-title">出典</h4>
      {dummyCitations.map((citation) => (
        <div key={citation.id} className="citation-item">
          <span className="citation-index">[{citation.id}]</span>
          {citation.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="citation-link"
            >
              {citation.source}
            </a>
          ) : (
            <span>{citation.source}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CitationList;