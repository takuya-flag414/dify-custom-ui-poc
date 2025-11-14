// src/components/CitationList.jsx
import React from 'react';
import './styles/MessageBlock.css';

/**
 * 出典リスト表示 (T-09, P-3)
 * @param {Array} citations - ChatAreaから渡される実データ
 */
const CitationList = ({ citations }) => {
  // ★ citationsが空配列、またはnull/undefinedの場合は何も表示しない
  if (!citations || citations.length === 0) {
    return null;
  }

  // ★ T-03時点のダミー表示を削除 [cite: 350-354]

  return (
    <div className="citation-list">
      <h4 className="citation-title">出典</h4>
      {/* ★ propsで渡された実データをmapする [cite: 358] */}
      {citations.map((citation, index) => (
        <div key={citation.id || index} className="citation-item">
          {/* ★ ChatAreaのmapCitationsで生成した [1], [2]... をそのまま利用 [cite: 271-286] */}
          {citation.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="citation-link"
            >
              {citation.source} {/* 例: [1] https://docs.dify.ai */}
            </a>
          ) : (
            <span>
                {citation.source} {/* 例: [2] FEモック.pdf */}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CitationList;