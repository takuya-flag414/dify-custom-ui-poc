// src/components/MarkdownRenderer.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GFM (テーブル、取り消し線など) をサポート
import './styles/MessageBlock.css'; // .markdown-renderer スタイル

/**
 * AI回答の本文をMarkdownで描画 (T-06)
 * @param {string} content - Markdown形式のテキスト
 */
const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // URLを新しいタブで開く設定
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;