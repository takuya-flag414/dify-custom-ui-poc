// src/components/Chat/Wizard/CapabilityWizard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './WizardStyles.css';

// System Icons
import { SearchIcon, PenToolIcon, FileTextIcon, SparklesIcon } from '../../Shared/SystemIcons';

// File Uploader
import WizardFileUploader from './WizardFileUploader';

// Privacy Textarea
import WizardPrivacyTextarea from './WizardPrivacyTextarea';

// Privacy Confirm Dialog
import PrivacyConfirmDialog from '../PrivacyConfirmDialog';

/**
 * macOS Sequoia Style Capability HUD
 * Apple Intelligence デザインシステムに準拠
 */
const CapabilityWizard = ({
    isOpen,
    onClose,
    scenarioData,
    onSubmit
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [formData, setFormData] = useState({});

    // 機密情報警告状態
    const [currentStepWarning, setCurrentStepWarning] = useState({
        hasWarning: false,
        detections: [],
        fileDetections: []
    });
    const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentStepIndex(0);
            setFormData({});
            setCurrentStepWarning({ hasWarning: false, detections: [], fileDetections: [] });
            setShowPrivacyConfirm(false);
        }
    }, [isOpen]);

    // ステップ変更時に警告状態をリセット
    useEffect(() => {
        setCurrentStepWarning({ hasWarning: false, detections: [], fileDetections: [] });
    }, [currentStepIndex]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // 条件付きステップをフィルタリングして表示可能なステップを取得
    const visibleSteps = useMemo(() => {
        if (!scenarioData?.steps) return [];
        return scenarioData.steps.filter(step => {
            if (step.conditionalShow) {
                return step.conditionalShow(formData);
            }
            return true;
        });
    }, [scenarioData?.steps, formData]);

    // 現在のステップ情報を計算（フックの後で使用するため）
    const currentStep = visibleSteps[currentStepIndex] || null;
    const totalSteps = visibleSteps.length;
    const isLastStep = currentStepIndex === totalSteps - 1;

    // --- Handlers (useCallback は早期リターンの前に配置) ---
    const proceedToNextStep = useCallback(() => {
        if (isLastStep) {
            onSubmit(formData);
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [isLastStep, formData, onSubmit]);

    const handleNext = useCallback(() => {
        // 機密情報検知ステップかつ警告ありの場合、確認ダイアログを表示
        const isPrivacyStep = currentStep?.type === 'privacy-textarea' ||
            currentStep?.type === 'file-upload' ||
            (currentStep?.type === 'dynamic' && formData?.source === 'ファイルをアップロード');

        if (isPrivacyStep && currentStepWarning.hasWarning) {
            setShowPrivacyConfirm(true);
            return;
        }

        proceedToNextStep();
    }, [currentStep?.type, currentStepWarning.hasWarning, proceedToNextStep, formData?.source]);

    const handlePrivacyConfirm = useCallback(() => {
        setShowPrivacyConfirm(false);
        proceedToNextStep();
    }, [proceedToNextStep]);

    const handlePrivacyCancel = useCallback(() => {
        setShowPrivacyConfirm(false);
    }, []);

    const handleBack = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        } else {
            onClose();
        }
    }, [currentStepIndex, onClose]);

    const updateFormData = useCallback((key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    // scenarioDataがない場合は何も表示しない
    if (!scenarioData) return null;

    // 有効なステップがない場合は何も表示しない
    if (!visibleSteps.length) return null;

    // 現在のステップが取得できない場合（インデックス範囲外など）は何も表示しない
    if (!currentStep) return null;

    // --- Animation Variants (Apple Spring Physics) ---
    const hudVariants = {
        hidden: {
            opacity: 0,
            scale: 0.92,
            y: 16,
            filter: "blur(8px)"
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 250,
                damping: 25,
                mass: 1
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 8,
            filter: "blur(6px)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        }
    };

    const contentVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 32 : -32,
            opacity: 0,
            filter: "blur(4px)"
        }),
        center: {
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 28
            }
        },
        exit: (direction) => ({
            x: direction < 0 ? 32 : -32,
            opacity: 0,
            filter: "blur(4px)",
            position: 'absolute',
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 28
            }
        })
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.2 }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.15 }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - すりガラス効果 */}
                    <motion.div
                        className="wizard-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Modal Layer - Portal経由でbody直下 */}
                    <div className="wizard-modal-layer">
                        {/* HUD Container */}
                        <motion.div
                            className="wizard-hud-container"
                            variants={hudVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layoutId={`capability-card-${scenarioData.id}`}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="wizard-title"
                        >
                            {/* Header */}
                            <header className="wizard-header">
                                <ScenarioIcon iconName={scenarioData.icon} />
                                <h2 id="wizard-title" className="wizard-title">
                                    {scenarioData.title}
                                </h2>
                                <button
                                    className="wizard-close-button"
                                    onClick={onClose}
                                    aria-label="閉じる"
                                >
                                    <X />
                                </button>
                            </header>

                            {/* Step Content */}
                            <div className="wizard-content-area">
                                <AnimatePresence mode="wait" custom={1}>
                                    <motion.div
                                        key={currentStep.id}
                                        variants={contentVariants}
                                        custom={1}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="w-full flex flex-col items-center"
                                    >
                                        <h3 className="wizard-question">
                                            {currentStep.question}
                                        </h3>
                                        <StepRenderer
                                            type={currentStep.type}
                                            options={currentStep.options}
                                            getOptions={currentStep.getOptions}
                                            placeholder={currentStep.placeholder}
                                            description={currentStep.description} // description を追加
                                            value={formData[currentStep.id]}
                                            onChange={(val) => updateFormData(currentStep.id, val)}
                                            formData={formData}
                                            showSubject={currentStep.showSubject}
                                            showRecipient={currentStep.showRecipient}
                                            onWarningChange={setCurrentStepWarning}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <footer className="wizard-footer">
                                <button
                                    className="wizard-back-button"
                                    onClick={handleBack}
                                >
                                    {currentStepIndex === 0 ? 'キャンセル' : '戻る'}
                                </button>

                                <div className="wizard-step-indicator" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
                                    {visibleSteps.map((_, index) => (
                                        <span
                                            key={index}
                                            className={`wizard-step-dot ${index === currentStepIndex ? 'active' : ''}`}
                                            aria-label={`ステップ ${index + 1} / ${totalSteps}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    className={`ai-glow-button ${isLastStep ? 'ai-active' : ''}`}
                                    onClick={handleNext}
                                    // toggleやcheckbox-groupの場合、値がfalse/空でも進める場合があるため、必須チェックを調整
                                    // ここでは簡易的に、toggleは常にOKとする
                                    disabled={currentStep.type !== 'toggle' && currentStep.type !== 'checkbox-group' && !formData[currentStep.id]}
                                >
                                    {isLastStep ? '生成する' : '次へ'}
                                </button>
                            </footer>
                        </motion.div>
                    </div>

                    {/* Privacy Confirm Dialog */}
                    {showPrivacyConfirm && (
                        <PrivacyConfirmDialog
                            detections={currentStepWarning.detections}
                            fileDetections={currentStepWarning.fileDetections}
                            onConfirm={handlePrivacyConfirm}
                            onCancel={handlePrivacyCancel}
                        />
                    )}
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// --- Helper Components ---

// アイコン動的読み込み用
const ScenarioIcon = ({ iconName }) => {
    const icons = { SearchIcon, PenToolIcon, FileTextIcon, SparklesIcon };
    const Icon = icons[iconName] || SparklesIcon;
    return <Icon className="w-5 h-5" style={{ opacity: 0.7 }} />;
};

// 入力UIのレンダラー (showSubject, showRecipient, description, onWarningChange を追加)
const StepRenderer = ({
    type,
    options,
    getOptions,
    placeholder,
    description,
    value,
    onChange,
    formData,
    showSubject,
    showRecipient,
    onWarningChange
}) => {
    switch (type) {
        case 'chips':
            return (
                <div className="wizard-chips-container">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`wizard-chip ${value === opt ? 'wizard-chip--active' : ''}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            );
        case 'dynamic-chips':
            const dynamicOptions = getOptions ? getOptions(formData) : options || [];
            return (
                <div className="wizard-chips-container">
                    {dynamicOptions.map(opt => (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            className={`wizard-chip ${value === opt ? 'wizard-chip--active' : ''}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            );
        case 'checkbox-group':
            return (
                <div className="wizard-chips-container">
                    {options.map(opt => {
                        const isSelected = (value || []).includes(opt);
                        return (
                            <button
                                key={opt}
                                onClick={() => {
                                    const current = value || [];
                                    const next = isSelected
                                        ? current.filter(c => c !== opt)
                                        : [...current, opt];
                                    onChange(next);
                                }}
                                className={`wizard-chip wizard-chip--negative ${isSelected ? 'wizard-chip--active' : ''}`}
                            >
                                {isSelected && <span className="mr-1.5 font-bold">✕</span>}
                                {opt}
                            </button>
                        );
                    })}
                </div>
            );
        case 'text':
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || '入力してください...'}
                    className="wizard-input"
                    autoFocus
                />
            );
        case 'privacy-textarea':
            const shouldShowSubject = typeof showSubject === 'function'
                ? showSubject(formData)
                : !!showSubject;

            const shouldShowRecipient = typeof showRecipient === 'function'
                ? showRecipient(formData)
                : !!showRecipient;

            return (
                <WizardPrivacyTextarea
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    showSubject={shouldShowSubject}
                    showRecipient={shouldShowRecipient}
                    onWarningChange={onWarningChange}
                />
            );
        case 'file-upload':
            return (
                <WizardFileUploader
                    files={value || []}
                    onChange={onChange}
                    multiple={true}
                    onWarningChange={onWarningChange}
                />
            );
        case 'dynamic':
            if (formData?.source === 'ファイルをアップロード') {
                return (
                    <WizardFileUploader
                        files={value || []}
                        onChange={onChange}
                        multiple={true}
                        onWarningChange={onWarningChange}
                    />
                );
            }
            return (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || '入力してください...'}
                    className="wizard-textarea"
                    autoFocus
                    rows={5}
                />
            );
        case 'toggle':
            return (
                <div className="wizard-toggle-wrapper">
                    <div className="wizard-toggle-container">
                        <label className="wizard-toggle-switch">
                            <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => onChange(e.target.checked)}
                            />
                            <span className="wizard-toggle-slider"></span>
                        </label>
                        <span className="wizard-toggle-status">
                            {value ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    {description && (
                        <p className="wizard-toggle-description">
                            {description}
                        </p>
                    )}
                </div>
            );
        default:
            return <div style={{ color: 'rgba(0,0,0,0.4)' }}>Unknown Step Type: {type}</div>;
    }
};

export default CapabilityWizard;