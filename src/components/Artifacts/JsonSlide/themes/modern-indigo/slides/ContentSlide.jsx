// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ContentSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const ContentSlide = ({ content, isStatic = false }) => {
    const {
        title,
        key_message,
        body_text,
        layout_variation = 'one-column',
        annotations = []
    } = content || {};

    const isTwoColumn = layout_variation === 'two-column';

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー: 一貫した規律 */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{
                    marginBottom: '2.5cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Content'} />
                </h2>
            </motion.div>

            {/* メイン・エディトリアルエリア */}
            <div className="flex-1 flex flex-col min-h-0 mt-[1cqi]">

                {/* 1. Key Message (Pull Quote Style) */}
                {key_message && (
                    <motion.div
                        className="flex-shrink-0"
                        style={{
                            borderLeft: '4px solid var(--slide-primary)',
                            paddingLeft: '1.5cqi',
                            marginBottom: '3.5cqi'
                        }}
                        initial={!isStatic ? { opacity: 0, x: -15 } : {}}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div style={{
                            fontSize: '1.6cqi',
                            color: 'var(--slide-heading)',
                            fontWeight: 700,
                            lineHeight: 1.5,
                            letterSpacing: '0.02em'
                        }}>
                            <SlideMarkdown content={key_message} />
                        </div>
                    </motion.div>
                )}

                {/* 2. Body Text (Editorial Columns) */}
                {body_text && (
                    <motion.div
                        className="flex-1 min-h-0 overflow-y-auto"
                        style={{
                            fontSize: '1.4cqi',
                            color: 'var(--slide-body)',
                            lineHeight: 1.7,
                            // 1カラム時は幅を90%に絞り、視線移動の負担を減らす（Measureの最適化）
                            maxWidth: isTwoColumn ? '100%' : '90%',
                            // 2カラム時の分割線 (Column Rule) を設定
                            columnCount: isTwoColumn ? 2 : 1,
                            columnGap: isTwoColumn ? '5cqi' : 'normal',
                            columnRule: isTwoColumn ? '1px solid #E2E8F0' : 'none',
                            columnFill: 'balance'
                        }}
                        initial={!isStatic ? { opacity: 0, y: 15 } : {}}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {/* Markdownレンダラー内で p タグの margin-bottom が効くように
                          標準的なマークダウンの余白ルールを継承させます
                        */}
                        <div className="slide-markdown-content">
                            <SlideMarkdown content={body_text} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 注釈 (フッター) */}
            {annotations?.length > 0 && (
                <div
                    className="flex-shrink-0"
                    style={{
                        fontSize: '1.1cqi',
                        color: '#64748B',
                        marginTop: '2cqi',
                        paddingTop: '1cqi',
                        borderTop: '1px solid #E2E8F0'
                    }}
                >
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 0.8cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContentSlide;