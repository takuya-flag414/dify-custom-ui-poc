// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ProcessFlowSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const ProcessFlowSlide = ({ content, isStatic = false }) => {
    const {
        title,
        steps = [],
        process_steps = [],
        items = [],
        key_message,
        body_text,
        annotations = []
    } = content || {};

    const rawSteps = process_steps.length > 0 ? process_steps : (steps.length > 0 ? steps : items);
    const activeSteps = Array.isArray(rawSteps) ? rawSteps : [];

    const getGridColumns = (count) => {
        if (count === 1) return 1;
        if (count === 2 || count === 4) return 2;
        if (count === 3 || count === 5 || count === 6) return 3;
        return 4;
    };

    const cols = getGridColumns(activeSteps.length);
    const rowCount = Math.ceil(activeSteps.length / cols);

    // -----------------------------------------
    // 情報密度（縦方向の圧迫度）の判定と動的余白計算
    // -----------------------------------------
    const hasBody = !!body_text;
    const hasKey = !!key_message;
    // 複数行、またはテキストブロックが両方ある場合は「高密度」と判定
    const isHighDensity = rowCount > 1 || (hasBody && hasKey);

    // 高密度の場合は余白とフォントサイズを引き締め、オーバーフローを防ぐ
    const contextMarginBottom = isHighDensity ? '1.5cqi' : '3.5cqi';
    const gridRowGap = isHighDensity ? '2.5cqi' : '4.5cqi';
    const keyMsgMarginTop = isHighDensity ? '1.5cqi' : '3cqi';

    const stepPaddingTop = isHighDensity ? '1cqi' : '1.5cqi';
    const stepTitleSize = isHighDensity ? '1.4cqi' : '1.6cqi';
    const stepDescSize = isHighDensity ? '1.3cqi' : '1.4cqi';

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{
                    marginBottom: '2cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Process Flow'} />
                </h2>
            </motion.div>

            {/* メインエリア (min-h-0 で flexbox の押し出し崩れを防ぐ) */}
            <div className="flex-1 flex flex-col mt-[1cqi] min-h-0">

                {/* 1. Analysis Context (body_text) */}
                {hasBody && (
                    <motion.div
                        className="relative flex-shrink-0"
                        style={{ paddingLeft: '1.5cqi', marginBottom: contextMarginBottom }}
                        initial={!isStatic ? { opacity: 0 } : {}}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div style={{
                            fontSize: '1cqi',
                            fontWeight: 800,
                            color: 'var(--slide-primary)',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            marginBottom: '0.4cqi'
                        }}>
                            Contextual Analysis
                        </div>
                        <div style={{
                            fontSize: '1.4cqi',
                            color: 'var(--slide-body)',
                            lineHeight: 1.6,
                            maxWidth: '92%',
                            fontWeight: 400
                        }}>
                            <SlideMarkdown content={body_text} />
                        </div>
                    </motion.div>
                )}

                {/* 2. Process Flow Grid */}
                <div className="flex-1 flex flex-col justify-center w-full min-h-0">
                    <div
                        className="grid w-full"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            rowGap: gridRowGap
                        }}
                    >
                        {activeSteps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="relative flex flex-col pr-[3cqi]"
                                style={{
                                    borderTop: '2px solid #E2E8F0',
                                    paddingTop: stepPaddingTop
                                }}
                                initial={!isStatic ? { opacity: 0, x: 15 } : {}}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                            >
                                <div className="absolute left-0 top-[-2px] w-[3cqi] h-[2px] bg-[var(--slide-primary)] z-10" />
                                <div className="absolute left-0 top-0 w-[1px] h-[1.8cqi] bg-[var(--slide-primary)] z-10" />

                                <div style={{
                                    fontSize: '1.1cqi', fontWeight: 800, color: 'var(--slide-primary)',
                                    fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '0.8cqi', paddingLeft: '0.8cqi'
                                }}>
                                    {String(index + 1).padStart(2, '0')}
                                </div>

                                <h3 style={{
                                    fontSize: stepTitleSize, fontWeight: 800, color: 'var(--slide-heading)',
                                    marginBottom: '0.8cqi', lineHeight: 1.3, paddingLeft: '0.8cqi'
                                }}>
                                    <SlideMarkdown content={step.title || step.label} inline />
                                </h3>

                                {(step.description || step.text) && (
                                    <div style={{ fontSize: stepDescSize, color: 'var(--slide-body)', lineHeight: 1.6, paddingLeft: '0.8cqi' }}>
                                        <SlideMarkdown content={step.description || step.text} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 3. Key Conclusion (key_message) */}
                {hasKey && (
                    <motion.div
                        className="mt-auto flex-shrink-0"
                        style={{ paddingTop: keyMsgMarginTop }}
                        initial={!isStatic ? { opacity: 0, y: 10 } : {}}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <div style={{
                            borderLeft: '4px solid var(--slide-primary)',
                            paddingLeft: '1.5cqi',
                            fontSize: '1.5cqi',
                            color: 'var(--slide-heading)',
                            lineHeight: 1.6,
                            fontWeight: 700
                        }}>
                            <SlideMarkdown content={key_message} />
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
                        marginTop: '1.5cqi', // 要素が膨らんできても最低限の余白を担保 
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

export default ProcessFlowSlide;