// src/components/Chat/Wizard/WizardFileUploader.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileIcon from '../../Shared/FileIcon';
import { scanFiles, isScannableFile } from '../../../utils/fileScanner';
import PrivacyWarningBanner from './PrivacyWarningBanner';
import './WizardFileUploader.css';

// --- Icons ---
const UploadCloudIcon = () => (
    <svg className="wizard-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m16 16-4-4-4 4" />
    </svg>
);

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const FileCountIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const WarningIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// --- Constants ---
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.md,.csv,.xlsx';

// --- Utility ---
const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Wizard File Uploader Component
 * DESIGN_RULE.md準拠のファイルアップローダー
 * - 複数ファイル対応
 * - 機密情報リアルタイム検知
 * - ドラッグ＆ドロップ
 */
const WizardFileUploader = ({ files = [], onChange, multiple = true, onWarningChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [oversizedFiles, setOversizedFiles] = useState([]);
    // ローカルでファイル状態を管理（スキャン結果の更新用）
    const [localFiles, setLocalFiles] = useState(Array.isArray(files) ? files : []);
    const fileInputRef = useRef(null);

    // propsのfilesが変更されたらローカルステートを同期
    useEffect(() => {
        if (Array.isArray(files)) {
            setLocalFiles(files);
        }
    }, [files]);

    // 親コンポーネントに警告状態を通知
    useEffect(() => {
        if (onWarningChange) {
            const hasWarning = localFiles.some(f => f.hasWarning);
            const fileDetections = localFiles
                .filter(f => f.hasWarning && f.detections && f.detections.length > 0)
                .map(f => ({
                    fileName: f.file.name,
                    detections: f.detections
                }));

            onWarningChange({
                hasWarning,
                detections: [],
                fileDetections
            });
        }
    }, [localFiles, onWarningChange]);

    // ファイル追加処理
    const addFiles = useCallback(async (newFiles) => {
        const validFiles = [];
        const oversized = [];

        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE) {
                oversized.push(file.name);
            } else {
                validFiles.push(file);
            }
        }

        if (oversized.length > 0) {
            setOversizedFiles(oversized);
            // 3秒後にクリア
            setTimeout(() => setOversizedFiles([]), 3000);
        }

        if (validFiles.length === 0) return;

        // 初期状態: scanningステータスで追加
        const initialFiles = validFiles.map(file => ({
            file,
            scanStatus: isScannableFile(file.name) ? 'scanning' : 'skipped',
            hasWarning: false,
            detections: [],
        }));

        const updatedFiles = multiple ? [...localFiles, ...initialFiles] : initialFiles;

        // ローカルステートと親コンポーネントを同時更新
        setLocalFiles(updatedFiles);
        onChange(updatedFiles);

        // 非同期でスキャン実行
        const scannedResults = await scanFiles(validFiles);

        // スキャン結果でローカルステートを更新
        setLocalFiles(prevLocalFiles => {
            const newFiles = prevLocalFiles.map(sf => {
                if (sf.scanStatus === 'scanning') {
                    const result = scannedResults.find(r => r.file === sf.file);
                    if (result) return result;
                }
                return sf;
            });
            // 親コンポーネントにも通知
            onChange(newFiles);
            return newFiles;
        });
    }, [localFiles, multiple, onChange]);

    // ファイル削除
    const removeFile = useCallback((index) => {
        setLocalFiles(prevLocalFiles => {
            const newFiles = prevLocalFiles.filter((_, i) => i !== index);
            // 親コンポーネントにも通知
            onChange(newFiles);
            return newFiles;
        });
    }, [onChange]);

    // ドラッグ＆ドロップハンドラ
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            addFiles(Array.from(droppedFiles));
        }
    }, [addFiles]);

    // ファイル選択ハンドラ
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    // クリックでファイル選択
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const fileCount = localFiles.length;
    const hasWarnings = localFiles.some(f => f.hasWarning);

    // Spring animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.15 }
        }
    };

    // ファイルがある場合はインラインモード
    const hasFiles = fileCount > 0;

    return (
        <div
            className="wizard-file-uploader"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* 警告バナー（常時表示） */}
            <PrivacyWarningBanner
                description="アップロードされたファイルの内容はAIに送信されます。機密情報を含むファイルのアップロードは避けてください。"
            />

            {/* ファイルがない場合のみフルドロップゾーンを表示 */}
            {!hasFiles && (
                <div
                    className={`wizard-dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    aria-label="ファイルをアップロード"
                >
                    <UploadCloudIcon />
                    <p className="wizard-dropzone-text">
                        ファイルを<strong>ドラッグ＆ドロップ</strong><br />
                        またはクリックして選択
                    </p>
                    <span className="wizard-dropzone-hint">
                        PDF, Word, テキスト, CSV, Excel（最大10MB）
                    </span>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept={ACCEPTED_EXTENSIONS}
                multiple={multiple}
            />

            {/* Size Warning */}
            <AnimatePresence>
                {oversizedFiles.length > 0 && (
                    <motion.div
                        className="wizard-size-warning"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <WarningIcon />
                        <span>{oversizedFiles.join(', ')} はサイズ上限(10MB)を超えています</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File List with Inline Add Card */}
            {hasFiles && (
                <>
                    <div className="wizard-file-list">
                        <AnimatePresence>
                            {localFiles.map((sf, index) => {
                                const statusClass = sf.scanStatus === 'scanning' ? 'scanning' :
                                    sf.hasWarning ? 'warning' : '';

                                return (
                                    <motion.div
                                        key={`${sf.file.name}-${index}`}
                                        className={`wizard-file-card ${statusClass}`}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        layout
                                    >
                                        <div className="wizard-file-icon">
                                            <FileIcon filename={sf.file.name} />
                                        </div>

                                        <div className="wizard-file-info">
                                            <span className="wizard-file-name">{sf.file.name}</span>
                                            <div className="wizard-file-meta">
                                                <span>{formatFileSize(sf.file.size)}</span>
                                                {sf.scanStatus === 'scanning' && (
                                                    <span className="wizard-file-status scanning">
                                                        スキャン中...
                                                    </span>
                                                )}
                                                {sf.hasWarning && (
                                                    <span className="wizard-file-status warning">
                                                        ⚠️ 機密情報を検知
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {sf.hasWarning && (
                                            <div className="wizard-file-shield" title="機密情報が含まれています">
                                                <ShieldIcon />
                                            </div>
                                        )}

                                        <button
                                            className="wizard-file-remove"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            title="削除"
                                        >
                                            <CloseIcon />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Inline Add Card */}
                        <div
                            className={`wizard-inline-add-card ${isDragging ? 'dragging' : ''}`}
                            onClick={handleClick}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="wizard-inline-add-icon">
                                <PlusIcon />
                            </div>
                            <div className="wizard-inline-add-text">
                                <span className="wizard-inline-add-title">ファイルを追加</span>
                                <span className="wizard-inline-add-hint">クリックまたはドラッグ＆ドロップ</span>
                            </div>
                        </div>
                    </div>

                    <div className="wizard-file-count">
                        <FileCountIcon />
                        <span>{fileCount}件のファイルを選択中</span>
                        {hasWarnings && (
                            <span style={{ color: 'var(--sys-color-warning, #FF9500)' }}>
                                （機密情報あり）
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default WizardFileUploader;
