// src/components/MarkdownRenderer.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GFM (テーブル、取り消し線など) をサポート
import './styles/MessageBlock.css'; // .markdown-renderer スタイル

/**
 * ★ 脚注 [1] を <sup>1</sup> に変換、または無効な番号 [5] を削除するロジック
 * @param {Array} children - ReactMarkdown の p/li タグの子要素
 * @param {number} citationCount - 出典リストの実際の件数 (e.g., 2)
 */
const renderWithInlineCitations = (children, citationCount) => {
  if (!children) return null;
  
  // children が配列でない場合 (単一の文字列など) も配列化して処理
  const childrenArray = Array.isArray(children) ? children : [children];

  const newChildren = [];

  childrenArray.forEach((child, i) => {
    // 子要素がテキストノードの場合のみ処理
    if (typeof child === 'string') {
      // 正規表現で [1] や [12] のような形式を検索
      // (\s*) を追加して前後のスペースも保持しつつ分割
      const parts = child.split(/(\[\d+\])/g); 
      
      parts.forEach((part, j) => {
        // [1] や [12] にマッチした場合
        if (/^\[\d+\]$/.test(part)) {
          const numberStr = part.replace(/[\[\]]/g, ''); // [ ] を削除
          const number = parseInt(numberStr, 10);
          
          // 数値が 0 より大きく、かつ実際の出典件数以下の場合のみ <sup> タグに変換
          if (number > 0 && number <= citationCount) {
            newChildren.push(
              <sup key={`${i}-${j}`} className="inline-citation">
                {number}
              </sup>
            );
          }
          // 無効な番号 (例: [5]) は表示しない (newChildrenにpushしない)ことで削除

        } else if (part) {
          // 通常のテキストや空文字はそのまま追加
          newChildren.push(part);
        }
      });
    } else {
      // テキストノード以外 (例: <a>, <strong> タグなど) は再帰的に処理せずそのまま追加
      // (必要ならここでも再帰処理が可能だが、通常は不要)
      newChildren.push(child);
    }
  });

  return newChildren;
};


/**
 * AI回答の本文をMarkdownで描画 (T-06)
 * @param {string} content - Markdown形式のテキスト
 * @param {boolean} isStreaming - ストリーミング中かどうかのフラグ
 * @param {Array} citations - 出典配列
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

  // 実際の出典件数を取得
  const citationCount = citations ? citations.length : 0;

  // ストリーミング完了後は ReactMarkdown でパース
  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // リンクを新しいタブで開く
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          // ★ 修正: p (段落) タグ内のテキスト処理
          p: ({ node, children, ...props }) => {
            const processedChildren = renderWithInlineCitations(children, citationCount);
            return <p {...props}>{processedChildren}</p>;
          },
          // ★ 追加: li (リスト項目) タグ内のテキスト処理
          // これにより、箇条書き内の [1] も正しくパースされる
          li: ({ node, children, ...props }) => {
             const processedChildren = renderWithInlineCitations(children, citationCount);
             return <li {...props}>{processedChildren}</li>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;