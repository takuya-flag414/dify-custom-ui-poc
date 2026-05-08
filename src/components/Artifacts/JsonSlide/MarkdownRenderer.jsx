// src/components/Artifacts/JsonSlide/MarkdownRenderer.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

/**
 * SlideMarkdown - スライド用のマークダウンレンダラー
 * 
 * 仕様:
 * - 基本的なMarkdown構文をサポート
 * - インラインHTML (<span class="...">, <mark>, <br>, <u>) を許可
 * - style属性はCSSで無効化、またはレンダリング時に除外
 * - 指定されたユーティリティクラスのみを反映
 * 
 * @param {string} content - マークダウン文字列
 * @param {string} className - ラッパーのクラス名
 * @param {Object} style - ラッパーのスタイル
 */
const SlideMarkdown = ({ content, className = '', style = {}, inline = false }) => {
    if (!content) return null;

    // 許可するタグのコンポーネント定義
    const components = {
        // spanタグのクラスをフィルタリング
        span: ({ node, className: spanClassName, children, ...props }) => {
            const allowedClasses = [
                'text-primary', 'text-accent', 'text-muted', 
                'text-success', 'text-danger', 'bg-highlight', 'bg-warning'
            ];
            
            const filteredClasses = spanClassName
                ? spanClassName.split(' ').filter(c => allowedClasses.includes(c)).join(' ')
                : '';

            return (
                <span className={filteredClasses} {...props}>
                    {children}
                </span>
            );
        },
        // markタグ
        mark: ({ node, className: markClassName, children, ...props }) => {
            const allowedClasses = ['bg-highlight', 'bg-warning'];
            const filteredClasses = markClassName
                ? markClassName.split(' ').filter(c => allowedClasses.includes(c)).join(' ')
                : 'bg-highlight';

            return (
                <mark className={filteredClasses} {...props}>
                    {children}
                </mark>
            );
        },
        // inlineモード時はpタグをspanとしてレンダリング
        p: ({ node, children, ...props }) => {
            if (inline) {
                return <span {...props}>{children}</span>;
            }
            return <p {...props}>{children}</p>;
        },
        // aタグはスライド内では基本的に無効化
        a: ({ node, children, ...props }) => {
            return <span>{children}</span>;
        }
    };

    const Wrapper = inline ? 'span' : 'div';

    // 文字列の \n や ¥n を Markdown の改行（行末のスペース2つ＋改行）またはパラグラフ区切りに変換
    let processedContent = content;
    if (typeof content === 'string') {
        processedContent = content.replace(/\\n|¥n/g, '  \n');
    }

    return (
        <Wrapper className={`slide-markdown-content ${className}`} style={style}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </Wrapper>
    );
};

export default SlideMarkdown;
