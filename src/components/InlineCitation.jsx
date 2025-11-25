// src/components/InlineCitation.jsx
import React from 'react';
import './styles/MessageBlock.css';

/**
 * 本文中に表示する小型の出典バッジ
 * DESIGN_RULE.md に準拠した青色アクセントを採用
 */
const InlineCitation = ({ number, citation }) => {
  // citation情報があれば、ツールチップ用にソース名を取得
  const title = citation ? citation.source : `出典 [${number}]`;
  const url = citation ? citation.url : null;

  // URLがある場合はリンクとして、なければspanとして機能させる
  const Component = url ? 'a' : 'span';
  const props = url 
    ? { href: url, target: '_blank', rel: 'noopener noreferrer' } 
    : {};

  return (
    <Component 
      className="inline-citation" 
      title={title}
      {...props}
    >
      {number}
    </Component>
  );
};

export default InlineCitation;