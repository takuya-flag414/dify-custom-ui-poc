// src/components/MarkdownRenderer.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GFM (テーブル、取り消し線など) をサポート
import './styles/MessageBlock.css'; // .markdown-renderer スタイル

/**
 * ★ 脚注 [1] を <sup>1</sup> に変換、または無効な番号 [5] を削除するロジック
 * @param {Array} children - ReactMarkdown の p タグの子要素
 * @param {number} citationCount - 出典リストの実際の件数 (e.g., 2)
 */
const renderWithInlineCitations = (children, citationCount) => {
  if (!children || !Array.isArray(children)) {
    return children;
  }

  const newChildren = [];

  children.forEach((child, i) => {
    // 子要素がテキストノードの場合のみ処理
    if (typeof child === 'string') {
      // 正規表現で [1] や [12] のような形式を検索
      const parts = child.split(/(\[\d+\])/g); // ( ) で囲むと、区切り文字も配列に残る
      
      parts.forEach((part, j) => {
        // [1] や [12] にマッチした場合
        if (/^\[\d+\]$/.test(part)) {
          const numberStr = part.replace(/[\[\]]/g, ''); // [ ] を削除
          const number = parseInt(numberStr, 10);
          
          // ★ 修正: 
          // 数値が 0 より大きく、かつ実際の出典件数 (citationCount) 以下の場合のみ
          // <sup> タグに変換する
          if (number > 0 && number <= citationCount) {
            newChildren.push(
              <sup key={`${i}-${j}`} className="inline-citation">
                {number}
              </sup>
            );
          }
          // ★ 修正: 
          // else (例: [5] など、出典件数を超えた数値) の場合、
          // newChildren.push(part) を行わない。
          // これにより、無効な番号がレンダリング結果から削除される。

        } else if (part) {
          // 通常のテキストや空文字はそのまま追加
          newChildren.push(part);
        }
      });
    } else {
      // テキストノード以外 (例: <a> タグなど) はそのまま
      newChildren.push(child);
    }
  });

  return newChildren;
};


/**
 * AI回答の本文をMarkdownで描画 (T-06)
 * @param {string} content - Markdown形式のテキスト
 * @param {boolean} isStreaming - ストリーミング中かどうかのフラグ
 * @param {Array} citations - ★ 修正: 出典配列
 */
const MarkdownRenderer = ({ content, isStreaming = false, citations = [] }) => {

  if (isStreaming) {
    // ストリーミング中は Markdown パースせず、生テキストを表示
    return (
      <div className="markdown-renderer">
        {content}
      </div>
    );
  }

  // ストリーミング完了後 (isStreaming: false) は、
  // ReactMarkdown で完全な content をパースする
  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // URLを新しいタブで開く設定
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          // ★ 修正: p (段落) タグのレンダリングをオーバーライド
          p: ({ node, children, ...props }) => {
            // ★ 修正: 実際の出典件数を取得
            const citationCount = citations ? citations.length : 0;
            // ★ 修正: ヘルパー関数に件数を渡し、無効な番号を削除
            const processedChildren = renderWithInlineCitations(children, citationCount);
            return <p {...props}>{processedChildren}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;