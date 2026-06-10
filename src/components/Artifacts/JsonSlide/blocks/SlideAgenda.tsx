import React from 'react';

// アジェンダ項目のオブジェクト定義
interface AgendaItemObject {
    title: string;
    subtitle?: string;
    duration?: string;
}

interface Props {
    items?: string[] | AgendaItemObject[];
    activeIndex?: number; // 進行中の章のインデックス (0-indexed)
}

export const SlideAgenda: React.FC<Props> = ({ items = [], activeIndex = -1 }) => {
    // 有効なハイライト項目（0以上のインデックス）が存在するかどうか
    const hasActiveHighlight = activeIndex !== undefined && activeIndex !== null && activeIndex >= 0 && activeIndex < items.length;

    return (
        <div className="slide-block slide-agenda" style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: '1cqi',
            padding: '1.5cqi 2cqi',
            background: 'var(--bg-section, #f8fafc)',
            borderRadius: '0.8cqi',
            boxSizing: 'border-box'
        }}>
            {items.map((item, idx) => {
                const isString = typeof item === 'string';
                const title = isString ? item : item.title;
                const subtitle = isString ? undefined : item.subtitle;
                const duration = isString ? undefined : item.duration;
                
                const isActive = hasActiveHighlight && idx === activeIndex;
                const isPast = hasActiveHighlight && idx < activeIndex;
                const isMuted = hasActiveHighlight && !isActive; // ハイライトがあって自分自身がアクティブでない場合のみミュート
                
                // マッキンゼーブルー & グレーアウトの色設計
                const circleBg = isActive 
                    ? 'var(--primary-color, #00205B)' 
                    : 'transparent';
                const circleColor = isActive 
                    ? '#ffffff' 
                    : (isMuted ? 'var(--text-muted, #94a3b8)' : 'var(--primary-color, #00205B)');
                const circleBorder = isActive
                    ? '1px solid var(--primary-color, #00205B)'
                    : (isMuted ? '1px solid var(--border-color, #cbd5e1)' : '1.5px solid var(--primary-color, #00205B)');
                
                const titleColor = isActive 
                    ? 'var(--primary-color, #00205B)' 
                    : (isMuted ? 'var(--text-muted, #94a3b8)' : 'var(--text-main, #1e293b)');
                const titleWeight = isActive || !hasActiveHighlight ? 'bold' : 'normal';
                
                return (
                    <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1.5cqi', 
                        position: 'relative',
                        padding: '0.6cqi 1cqi',
                        borderRadius: '0.4cqi',
                        background: isActive ? 'rgba(0, 32, 91, 0.04)' : 'transparent',
                        borderLeft: isActive ? '4px solid var(--primary-color, #00205B)' : '4px solid transparent',
                        marginLeft: '-4px', // ボーダー分のオフセット
                        transition: 'all 0.2s ease',
                        opacity: isMuted ? 0.45 : 1.0 // 非アクティブの項目のみ半透明にして視線誘導効果を出す
                    }}>
                        {/* 左：章番号（丸） */}
                        <div style={{
                            width: '2.4cqi',
                            height: '2.4cqi',
                            borderRadius: '50%',
                            background: circleBg,
                            color: circleColor,
                            border: circleBorder,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1cqi',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>
                            {isPast ? '✓' : idx + 1}
                        </div>
                        
                        {/* 中央：章タイトルとサブタイトル */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2cqi' }}>
                            <div style={{ 
                                fontSize: '1.3cqi', 
                                fontWeight: titleWeight, 
                                color: titleColor 
                             }}>
                                {title}
                            </div>
                            {subtitle && (
                                <div style={{ 
                                    fontSize: '1.0cqi', 
                                    color: isActive ? 'var(--text-main, #333333)' : (isMuted ? 'var(--text-muted, #94a3b8)' : 'var(--text-secondary, #475569)'),
                                    opacity: isActive ? 0.8 : 0.7
                                }}>
                                    {subtitle}
                                </div>
                            )}
                        </div>
                        
                        {/* 右：時間配分 */}
                        {duration && (
                            <div style={{ 
                                fontSize: '1.1cqi', 
                                color: isActive ? 'var(--primary-color, #00205B)' : (isMuted ? 'var(--text-muted, #94a3b8)' : 'var(--text-secondary, #475569)'),
                                fontWeight: isActive ? 'bold' : 'normal',
                                opacity: isActive ? 0.9 : 0.8,
                                flexShrink: 0
                            }}>
                                {duration}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
