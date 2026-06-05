import React from 'react';

interface TimelineStepObject {
    title: string;
    owner?: string;
    content?: string[];
}

interface Props {
    direction?: 'horizontal' | 'vertical';
    show_arrows?: boolean;
    steps?: string[] | TimelineStepObject[];
}

const parseLine = (line: string, key: number) => {
    const trimmed = line.trim();
    const isSubBullet = trimmed.startsWith('-') || trimmed.startsWith('—') || trimmed.startsWith('ー') || trimmed.startsWith('•') || trimmed.startsWith('・');
    
    const indentLevel = line.length - line.trimStart().length;
    const isNested = indentLevel >= 2;

    if (isSubBullet) {
        const bulletText = trimmed.replace(/^[-—ー•・]\s*/, '');
        return (
            <div key={key} style={{ 
                paddingLeft: isNested ? '1.8cqi' : '1cqi', 
                fontSize: isNested ? '1.1cqi' : '1.2cqi', 
                color: isNested ? 'var(--text-muted, #475569)' : 'inherit',
                position: 'relative',
                lineHeight: '1.6',
                textAlign: 'left'
            }}>
                <span style={{ 
                    position: 'absolute', 
                    left: isNested ? '0.6cqi' : '0px', 
                    color: 'var(--text-muted, #64748b)'
                }}>
                    {isNested ? '–' : '•'}
                </span>
                <span style={{ display: 'inline-block', paddingLeft: '1cqi' }}>{bulletText}</span>
            </div>
        );
    }

    return (
        <div key={key} style={{ 
            fontSize: '1.2cqi', 
            lineHeight: '1.6',
            textAlign: 'left',
            paddingLeft: isNested ? '1cqi' : '0px'
        }}>
            {line}
        </div>
    );
};

const renderContentItem = (text: string, idx: number) => {
    const lines = text.split('\n');
    return (
        <div key={idx} style={{ marginBottom: '0.8cqi' }}>
            {lines.map((line, lIdx) => parseLine(line, lIdx))}
        </div>
    );
};

export const SlideTimeline: React.FC<Props> = ({ direction = 'horizontal', show_arrows = true, steps = [] }) => {
    const isHorizontal = direction === 'horizontal';
    const isStructured = steps.length > 0 && typeof steps[0] === 'object';

    if (isStructured) {
        const objectSteps = steps as TimelineStepObject[];
        
        if (direction === 'vertical') {
            return (
                <div className="slide-block slide-timeline-structured-vertical" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1cqi', padding: '1.2cqi', background: 'var(--bg-section, #f8fafc)', borderRadius: '0.8cqi', boxSizing: 'border-box' }}>
                    {objectSteps.map((step, idx) => {
                        const isLast = idx === objectSteps.length - 1;
                        return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.6cqi' }}>
                                <div style={{ display: 'flex', gap: '1.5cqi', alignItems: 'flex-start' }}>
                                    {/* 左側: フェーズ名と作業者 */}
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '16cqi', flexShrink: 0, gap: '0.4cqi' }}>
                                        <div style={{ 
                                            background: 'var(--primary-color, #00205B)', 
                                            color: '#ffffff', 
                                            padding: '0.6cqi 1cqi', 
                                            fontWeight: 'bold', 
                                            fontSize: '1.2cqi', 
                                            textAlign: 'center', 
                                            borderRadius: '0.4cqi',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {step.title}
                                        </div>
                                        {step.owner && (
                                            <div style={{ fontSize: '1.1cqi', fontWeight: 'bold', color: 'var(--text-muted, #475569)', paddingLeft: '0.4cqi' }}>
                                                担当: {step.owner}
                                            </div>
                                        )}
                                    </div>
                                    {/* 右側: 作業内容 */}
                                    <div style={{ flex: 1, paddingLeft: '1cqi', display: 'flex', flexDirection: 'column', gap: '0.4cqi' }}>
                                        {step.content ? (
                                            step.content.map((item, cIdx) => renderContentItem(item, cIdx))
                                        ) : (
                                            <div style={{ fontSize: '1.2cqi', color: 'var(--text-muted, #94a3b8)' }}>–</div>
                                        )}
                                    </div>
                                </div>
                                {/* 矢印 */}
                                {!isLast && show_arrows && (
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        width: '16cqi', 
                                        color: 'var(--text-muted, #94a3b8)', 
                                        fontSize: '1.4cqi', 
                                        fontWeight: 'bold',
                                        marginTop: '-0.2cqi',
                                        marginBottom: '-0.2cqi'
                                    }}>
                                        ↓
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="slide-block slide-timeline-structured" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.5cqi', padding: '1.5cqi', background: 'var(--bg-section, #f8fafc)', borderRadius: '0.8cqi' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `10cqi repeat(${objectSteps.length}, 1fr)`,
                    columnGap: '1.5cqi',
                    rowGap: '1.2cqi',
                    width: '100%',
                    alignItems: 'stretch'
                }}>
                    {/* 1行目: プロセスヘッダー (Chevron) */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontSize: '1.2cqi', 
                        fontWeight: 'bold', 
                        color: 'var(--text-muted, #475569)'
                    }}>
                        {/* 左端の空スペース */}
                    </div>
                    {objectSteps.map((step, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === objectSteps.length - 1;
                        
                        let clipPath = 'polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 8% 50%)';
                        if (isFirst) {
                            clipPath = 'polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%)';
                        } else if (isLast) {
                            clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 8% 50%)';
                        }

                        return (
                            <div 
                                key={idx} 
                                style={{ 
                                    background: 'var(--primary-color, #00205B)', 
                                    color: '#ffffff', 
                                    padding: '1cqi 2cqi 1cqi 2.5cqi',
                                    fontWeight: 'bold',
                                    fontSize: '1.3cqi',
                                    textAlign: 'center',
                                    clipPath: clipPath,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    whiteSpace: 'nowrap',
                                    marginLeft: isFirst ? '0px' : '-1cqi'
                                }}
                            >
                                {step.title}
                            </div>
                        );
                    })}

                    {/* 2行目: 作業者 */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontSize: '1.3cqi', 
                        fontWeight: 'bold', 
                        color: 'var(--text-color, #1e293b)',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        padding: '1cqi 0'
                    }}>
                        作業者
                    </div>
                    {objectSteps.map((step, idx) => (
                        <div 
                            key={idx} 
                            style={{ 
                                fontSize: '1.3cqi', 
                                fontWeight: 'bold', 
                                color: 'var(--text-color, #1e293b)',
                                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                padding: '1cqi 0.5cqi',
                                textAlign: 'left'
                            }}
                        >
                             {step.owner || '–'}
                        </div>
                    ))}

                    {/* 3行目: 作業内容 */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        fontSize: '1.3cqi', 
                        fontWeight: 'bold', 
                        color: 'var(--text-color, #1e293b)',
                        padding: '1cqi 0'
                    }}>
                        作業内容
                    </div>
                    {objectSteps.map((step, idx) => (
                        <div 
                            key={idx} 
                            style={{ 
                                padding: '1cqi 0.5cqi',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4cqi'
                            }}
                        >
                            {step.content ? (
                                step.content.map((item, cIdx) => renderContentItem(item, cIdx))
                            ) : (
                                <div style={{ fontSize: '1.2cqi', color: 'var(--text-muted, #94a3b8)' }}>–</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const stringSteps = steps as string[];
    return (
        <div className={`slide-block slide-timeline ${isHorizontal ? 'timeline-horizontal' : 'timeline-vertical'}`} style={{ display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', gap: '1.2cqi', alignItems: isHorizontal ? 'center' : 'flex-start', justifyContent: 'space-between', width: '100%', padding: '1.5cqi', background: 'var(--bg-section, #f8fafc)', borderRadius: '0.8cqi' }}>
            {stringSteps.map((step, idx) => (
                <React.Fragment key={idx}>
                    <div className="timeline-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: isHorizontal ? '8cqi' : 'auto', textAlign: 'center' }}>
                        <div className="step-circle" style={{ width: '3cqi', height: '3cqi', borderRadius: '50%', backgroundColor: 'var(--primary-color, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '0.8cqi', fontSize: '1.2cqi' }}>
                            {idx + 1}
                        </div>
                        <div className="step-label" style={{ fontSize: '1.2cqi', fontWeight: 'bold', color: 'var(--text-color, #1e293b)' }}>
                            {step}
                        </div>
                    </div>
                    {show_arrows && idx < stringSteps.length - 1 && (
                        <div className="timeline-arrow" style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '1.8cqi', fontWeight: 'bold' }}>
                            {isHorizontal ? '➔' : '↓'}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
