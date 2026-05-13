// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/SplitSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * SplitSlide - 対比・分割スライド
 * 左右のセクションをセンターディバイダーで対比させるプロフェッショナルデザイン
 */
const SplitSlide = ({ content, isStatic = false }) => {
    const {
        title,
        left_title, left_label, left_text, left_body, left_bullets = [], left_column = [],
        right_title, right_label, right_text, right_body, right_bullets = [], right_column = [],
        comparison_icon = 'VS',
        annotations = []
    } = content || {};

    const lTitle = left_title || left_label || '現状 / 課題';
    const lText = left_text || left_body;
    const lBullets = Array.isArray(left_bullets) && left_bullets.length > 0 ? left_bullets : (Array.isArray(left_column) ? left_column : []);

    const rTitle = right_title || right_label || '理想 / 解決策';
    const rText = right_text || right_body;
    const rBullets = Array.isArray(right_bullets) && right_bullets.length > 0 ? right_bullets : (Array.isArray(right_column) ? right_column : []);

    // リストのレンダリング（左右でデザインを分ける）
    const renderList = (items, isRight) => {
        if (!items || items.length === 0) return null;
        return (
            <ul className="flex flex-col gap-[1.2cqi] mt-[1.5cqi]">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-[1cqi]" style={{ fontSize: '1.4cqi', lineHeight: 1.6, color: 'var(--slide-body)' }}>
                        <span style={{
                            marginTop: '0.2cqi',
                            // 左は静的なダッシュ、右は動的なブランドカラーの矢印
                            color: isRight ? 'var(--slide-primary)' : 'var(--slide-muted)',
                            fontSize: isRight ? '1.2cqi' : '1.4cqi',
                            fontWeight: isRight ? '900' : 'bold',
                            fontFamily: 'monospace'
                        }}>
                            {isRight ? '▶' : '—'}
                        </span>
                        <span><SlideMarkdown content={item} inline /></span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '2cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Comparison'} />
                </h2>
            </motion.div>

            {/* 二項対立のメインレイアウト (Analytical Dichotomy) */}
            <div className="flex-1 relative flex items-stretch mt-[1cqi]">

                {/* 中央ディバイダーとバッジ */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-200 -translate-x-1/2 z-0" />
                {comparison_icon && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white px-[1.5cqi] py-[0.6cqi] rounded-full border border-slate-200 shadow-sm flex items-center justify-center">
                        <span style={{
                            fontSize: '0.9cqi',
                            color: '#64748B',
                            fontWeight: 800,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            lineHeight: 1
                        }}>
                            {comparison_icon}
                        </span>
                    </div>
                )}

                {/* 左カラム (静的・現状) */}
                <motion.div
                    className="flex-1 pr-[6cqi] flex flex-col pt-[1cqi]"
                    initial={!isStatic ? { opacity: 0, x: -15 } : {}}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h3 style={{
                        fontSize: '1.6cqi',
                        fontWeight: 700,
                        color: '#64748B', // slate-500 (控えめな色)
                        marginBottom: '1.5cqi',
                        letterSpacing: '0.05em'
                    }}>
                        <SlideMarkdown content={lTitle} inline />
                    </h3>
                    {lText && (
                        <div style={{ fontSize: '1.4cqi', color: 'var(--slide-body)', lineHeight: 1.7 }}>
                            <SlideMarkdown content={lText} />
                        </div>
                    )}
                    {renderList(lBullets, false)}
                </motion.div>

                {/* 右カラム (動的・理想/解決策) */}
                <motion.div
                    className="flex-1 pl-[6cqi] flex flex-col pt-[1cqi]"
                    initial={!isStatic ? { opacity: 0, x: 15 } : {}}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h3 style={{
                        fontSize: '1.6cqi',
                        fontWeight: 800,
                        color: 'var(--slide-heading)',
                        marginBottom: '1.5cqi',
                        borderLeft: '4px solid var(--slide-primary)', // Indigoのアクセント
                        paddingLeft: '1.2cqi',
                        lineHeight: 1.2
                    }}>
                        <SlideMarkdown content={rTitle} inline />
                    </h3>
                    {rText && (
                        <div style={{ fontSize: '1.4cqi', color: 'var(--slide-body)', lineHeight: 1.7, paddingLeft: '1.6cqi' }}>
                            <SlideMarkdown content={rText} />
                        </div>
                    )}
                    <div style={{ paddingLeft: '1.6cqi' }}>
                        {renderList(rBullets, true)}
                    </div>
                </motion.div>
            </div>

            {/* 注釈 */}
            {annotations?.length > 0 && (
                <div style={{
                    fontSize: '1.1cqi',
                    color: '#64748B',
                    marginTop: '2cqi',
                    paddingTop: '1cqi',
                    borderTop: '1px solid var(--slide-border)'
                }}>
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

export default SplitSlide;
