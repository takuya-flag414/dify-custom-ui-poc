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
        left_title, left_label,
        left_text, left_body,
        left_bullets = [], left_column = [],
        right_title, right_label,
        right_text, right_body,
        right_bullets = [], right_column = [],
        comparison_icon = 'VS',
        annotations = [] 
    } = content || {};

    // データの読み替え（互換性維持）
    const lTitle = left_title || left_label || '現状';
    const lText = left_text || left_body;
    const lBullets = Array.isArray(left_bullets) && left_bullets.length > 0 ? left_bullets : (Array.isArray(left_column) ? left_column : []);

    const rTitle = right_title || right_label || '理想';
    const rText = right_text || right_body;
    const rBullets = Array.isArray(right_bullets) && right_bullets.length > 0 ? right_bullets : (Array.isArray(right_column) ? right_column : []);

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <motion.div 
                className="indigo-slide-header"
                style={{ flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || '比較・分析'} />
                </h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="indigo-slide-body" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: 0,
                justifyContent: 'flex-start',
                paddingTop: '0'
            }}>
                {(() => {
                    // 情報密度の算出（Markdownの行数をカウント）
                    const lLines = lText ? lText.split('\n').length : 0;
                    const rLines = rText ? rText.split('\n').length : 0;
                    const lineCount = lLines + rLines;
                    const textLength = (lText?.length || 0) + (rText?.length || 0);
                    const densityScore = (lineCount * 3) + (textLength / 20) + (annotations.length > 0 ? 2 : 0);
                    
                    // スケーリング
                    const scaleFactor = densityScore > 50 ? 0.75
                                      : densityScore > 35 ? 0.85
                                      : densityScore > 20 ? 0.95
                                      : 1.0;

                    const cardPadding = densityScore > 25 ? '2cqi 2.5cqi' : '3cqi 4cqi';
                    const listGap = densityScore > 25 ? '0.8cqi' : '1.2cqi';

                    const renderColumn = (cTitle, cText, isHighlight = false) => (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.8cqi' }}>
                            <h3 style={{ 
                                fontSize: '2.2cqi', 
                                color: isHighlight ? 'var(--slide-primary)' : 'var(--slide-heading)', 
                                fontWeight: 800,
                                margin: 0,
                                textAlign: 'center',
                                lineHeight: 1.4,
                                paddingTop: '0.8cqi',
                                letterSpacing: '0.05em'
                            }}>
                                <SlideMarkdown content={cTitle} />
                            </h3>
                            <div className="indigo-panel" style={{ 
                                flex: 1,
                                padding: cardPadding,
                                background: isHighlight ? 'linear-gradient(135deg, #ffffff 0%, rgba(99, 102, 241, 0.05) 100%)' : '#ffffff',
                                border: isHighlight ? '2px solid var(--slide-primary)' : '1px solid var(--slide-border)',
                                borderTop: isHighlight ? '6px solid var(--slide-primary)' : '1px solid var(--slide-border)',
                                boxShadow: isHighlight ? '0 10px 25px rgba(99, 102, 241, 0.1)' : '0 4px 15px rgba(0,0,0,0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '0.5cqi'
                            }}>
                                {cText && (
                                    <div style={{ 
                                        fontSize: '1.8cqi', 
                                        color: '#334155', 
                                        lineHeight: 1.6, 
                                        margin: 0,
                                        fontWeight: 500
                                    }}>
                                        <SlideMarkdown content={cText} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );

                    return (
                        <div style={{ 
                            transform: `scale(${scaleFactor})`, 
                            transformOrigin: 'top center',
                            width: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start', // 中央から上寄せに変更
                            marginTop: '0'           // ネガティブマージンを廃止して見切れを防止
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                gap: '4cqi', 
                                flex: 1, 
                                alignItems: 'stretch',
                                position: 'relative'
                            }}>
                                {/* 左カラム */}
                                <motion.div 
                                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                    {...(!isStatic && { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.2 } })}
                                >
                                    {renderColumn(lTitle, lText, false)}
                                </motion.div>

                                {/* センターディバイダー */}
                                <div style={{ 
                                    position: 'absolute',
                                    left: '50%',
                                    top: '15%',
                                    bottom: '5%',
                                    width: '1px',
                                    background: 'linear-gradient(to bottom, transparent, var(--slide-border), transparent)',
                                    transform: 'translateX(-50%)',
                                    zIndex: 5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <motion.div 
                                        style={{ 
                                            background: 'var(--slide-primary)',
                                            color: '#ffffff',
                                            padding: '0.8cqi 1.2cqi',
                                            borderRadius: '2cqi',
                                            fontSize: '1.4cqi',
                                            fontWeight: 900,
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                            zIndex: 10
                                        }}
                                        {...(!isStatic && { 
                                            initial: { scale: 0, opacity: 0 }, 
                                            animate: { scale: 1, opacity: 1 }, 
                                            transition: { delay: 0.6, type: 'spring', damping: 12 } 
                                        })}
                                    >
                                        <SlideMarkdown content={comparison_icon} />
                                    </motion.div>
                                </div>

                                {/* 右カラム */}
                                <motion.div 
                                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                    {...(!isStatic && { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.4 } })}
                                >
                                    {renderColumn(rTitle, rText, true)}
                                </motion.div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* フッター注釈 */}
            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted, #94a3b8)', 
                    marginTop: 'auto', 
                    paddingTop: '1.5cqi', 
                    borderTop: '1px solid var(--slide-border, #e2e8f0)',
                    flexShrink: 0
                }}>
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 1cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SplitSlide;
