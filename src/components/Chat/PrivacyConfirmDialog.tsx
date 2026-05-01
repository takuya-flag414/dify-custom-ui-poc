// src/components/Chat/PrivacyConfirmDialog.tsx
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './PrivacyConfirmDialog.css';

export interface Detection {
    id: string;
    label: string;
    count: number;
    matches?: string[]; // ★追加: 具体的なマッチ文字列
}

export interface FileDetection {
    fileName: string;
    detections: Detection[];
}

interface PrivacyConfirmDialogProps {
    detections?: Detection[];
    fileDetections?: FileDetection[];
    onConfirm: (excludedTypes: string[], excludedValues: string[]) => void; // ★変更
    onCancel: () => void;
    isShieldActive?: boolean;
}

const ShieldIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

interface TextItem {
    id: string; // "phone_number_09012345678" のようなユニークID
    typeId: string;
    label: string;
    value: string;
}

const PrivacyConfirmDialog: React.FC<PrivacyConfirmDialogProps> = ({
    detections = [],
    fileDetections = [],
    onConfirm,
    onCancel,
    isShieldActive = false,
}) => {
    // 1. 個別の検知値をフラットなリストに展開
    const textItems: TextItem[] = [];
    detections.forEach(d => {
        if (d.matches && d.matches.length > 0) {
            // 重複を排除してユニークな値ごとにリスト化
            const uniqueMatches = Array.from(new Set(d.matches));
            uniqueMatches.forEach((match, index) => {
                textItems.push({
                    id: `${d.id}_${index}_${match}`,
                    typeId: d.id,
                    label: d.label,
                    value: match
                });
            });
        }
    });

    // 2. 各文字列（value）ごとのサニタイズ有効/無効状態
    const [sanitizeFlags, setSanitizeFlags] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        textItems.forEach(item => { initial[item.value] = true; });
        return initial;
    });

    // 3. 詳細情報のアコーディオン開閉状態
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const toggleFlag = useCallback((value: string) => {
        setSanitizeFlags(prev => ({ ...prev, [value]: !prev[value] }));
    }, []);

    const excludedValues = Object.entries(sanitizeFlags)
        .filter(([, enabled]) => !enabled)
        .map(([value]) => value);

    const hasExcluded = excludedValues.length > 0;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleConfirm = () => {
        // ★変更: textItems展開後は個別除外(excludedValues)のみを利用し、
        // カテゴリ除外(excludedTypes)は使わないので空配列を渡す。
        onConfirm([], excludedValues);
    };

    const hasTextDetections = textItems.length > 0;
    const hasFileDetections = fileDetections.length > 0;

    const totalTextDetections = detections.reduce((sum, d) => sum + d.count, 0);
    const totalFileDetections = fileDetections.reduce((sum, f) => sum + f.detections.reduce((s, d) => s + d.count, 0), 0);
    const totalDetections = totalTextDetections + totalFileDetections;

    return ReactDOM.createPortal(
        <div className="privacy-confirm-overlay" onClick={onCancel}>
            <div className="privacy-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                
                <div className="privacy-confirm-header">
                    <div className="privacy-confirm-icon">
                        <ShieldIcon />
                    </div>
                    <h3 className="privacy-confirm-title">
                        機密情報を検知しました
                    </h3>
                </div>

                <div className="privacy-confirm-summary">
                    {hasFileDetections ? (
                        <p>
                            以下の情報を自動でマスキングして送信します。<br />
                            <strong>添付ファイル内の情報は保護対象外です。</strong>
                        </p>
                    ) : (
                        <p>安全のため、以下の情報を自動でマスキング（トークン化）して送信します。</p>
                    )}
                </div>

                <div className="privacy-confirm-accordion">
                    <button 
                        type="button"
                        className="privacy-confirm-accordion-toggle"
                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    >
                        {isDetailsOpen ? '▲ 詳細情報を閉じる' : '▼ 詳細情報（個別に保護/除外）'}
                    </button>

                    {isDetailsOpen && (
                        <div className="privacy-confirm-list-container">
                            {hasTextDetections && (
                                <ul className="privacy-confirm-list">
                                    {textItems.map((item) => (
                                        <li key={item.id} className="privacy-confirm-item">
                                            <span className="privacy-confirm-item-label">
                                                <span className="privacy-confirm-item-category">[{item.label}]</span>
                                                <span className="privacy-confirm-item-value">{item.value}</span>
                                            </span>
                                            <button
                                                type="button"
                                                className={`privacy-toggle ${sanitizeFlags[item.value] ? 'privacy-toggle--on' : 'privacy-toggle--off'}`}
                                                onClick={() => toggleFlag(item.value)}
                                                title={sanitizeFlags[item.value] ? '保護（ON）' : '除外（OFF）'}
                                            >
                                                <span className="privacy-toggle__circle" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {hasFileDetections && (
                                <ul className="privacy-confirm-list privacy-confirm-list--files">
                                    {fileDetections.map((fileItem, idx) => (
                                        fileItem.detections.map((item, dIdx) => (
                                            <li key={`${idx}-${dIdx}`} className="privacy-confirm-item privacy-confirm-item--file">
                                                <span className="privacy-confirm-item-label">
                                                    <span className="privacy-confirm-item-category">[{item.label}]</span>
                                                    <span className="privacy-confirm-item-value">{fileItem.fileName}</span>
                                                </span>
                                                <span className="privacy-file-warning-icon" title="添付ファイルは保護できません">⚠️</span>
                                            </li>
                                        ))
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {hasExcluded && (
                    <div className="privacy-confirm-warning-inline">
                        <span className="privacy-confirm-warning__icon">⚠️</span>
                        <span>除外された項目はマスキングされず、そのまま送信されます。</span>
                    </div>
                )}

                <div className="privacy-confirm-footer">
                    {!isShieldActive && (
                        <p className="privacy-confirm-shield-footer-notice">
                            ※送信後はシールドモードとなり、ブラウザ終了で元の情報は完全に消去されます。
                        </p>
                    )}
                    <div className="privacy-confirm-actions">
                        <button className="privacy-confirm-btn-cancel" onClick={onCancel}>
                            キャンセル
                        </button>
                        <button className="privacy-confirm-btn-send" onClick={handleConfirm}>
                            マスキングして送信
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default PrivacyConfirmDialog;

