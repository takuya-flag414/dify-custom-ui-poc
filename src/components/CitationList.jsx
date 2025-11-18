// src/components/CitationList.jsx
import React from 'react';
import './styles/MessageBlock.css';
import CitationItem from './CitationItem'; // ★ 新しいコンポーネントをインポート

/**
 * 出典リスト表示 (T-09, P-3)
 * @param {Array} citations - ChatAreaから渡される実データ
 */
const CitationList = ({ citations }) => {
  // citationsが空配列、またはnull/undefinedの場合は何も表示しない
  if (!citations || citations.length === 0) {
    return null;
  }

  // ★ T-03時点のダミー表示は削除済み

  return (
    <div className="citation-list">
      <h4 className="citation-title">出典</h4>
      {/* ★ propsで渡された実データを CitationItem コンポーネントに渡す [cite: 358] */}
      {citations.map((citation, index) => (
        <CitationItem 
          key={citation.id || index} 
          citation={citation} 
        />
      ))}
    </div>
  );
};

export default CitationList;