/**
 * StudioWizardModal - スタジオ作成・編集ウィザード
 * 
 * macOSの設定パネル風のウィザードモーダル。
 * 2ステップ: Identity → Context
 * 
 * React Portalを使用してdocument.bodyに直接レンダリング
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, Save } from 'lucide-react';
import { useStudio } from '../../../context/StudioContext';
import { Studio, IntelligenceColor } from '../../../types/studio';
import StepIdentity from './StepIdentity';
import StepContext from './StepContext';
import './StudioWizard.css';

interface StudioWizardModalProps {
    /** モーダルが開いているか */
    isOpen: boolean;
    /** 閉じるコールバック */
    onClose: () => void;
    /** 編集するスタジオ（undefinedの場合は新規作成モード） */
    editingStudio?: Studio;
}

type WizardStep = 'identity' | 'context';

interface WizardData {
    name: string;
    icon: string;
    themeColor: IntelligenceColor;
    description: string;
    systemPrompt: string;
    inputPlaceholder: string;
    welcomeMessage: string;
}

const initialData: WizardData = {
    name: '',
    icon: '✨',
    themeColor: 'blue',
    description: '',
    systemPrompt: '',
    inputPlaceholder: 'メッセージを入力...',
    welcomeMessage: 'こんにちは！何かお手伝いできることはありますか？',
};

/**
 * StudioWizardModal
 */
export const StudioWizardModal: React.FC<StudioWizardModalProps> = ({
    isOpen,
    onClose,
    editingStudio,
}) => {
    const { createStudio, updateStudio } = useStudio();
    const [step, setStep] = useState<WizardStep>('identity');
    const [data, setData] = useState<WizardData>(initialData);

    // 編集モードかどうか
    const isEditMode = !!editingStudio;

    // 編集モードの場合、スタジオデータで初期化
    useEffect(() => {
        if (isOpen && editingStudio) {
            setData({
                name: editingStudio.name,
                icon: editingStudio.icon,
                themeColor: editingStudio.themeColor,
                description: editingStudio.description,
                systemPrompt: editingStudio.systemPrompt,
                inputPlaceholder: editingStudio.inputPlaceholder,
                welcomeMessage: editingStudio.welcomeMessage,
            });
        } else if (isOpen && !editingStudio) {
            setData(initialData);
        }
    }, [isOpen, editingStudio]);

    // データ更新
    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    // 次のステップへ
    const handleNext = useCallback(() => {
        if (step === 'identity') {
            setStep('context');
        }
    }, [step]);

    // 前のステップへ
    const handleBack = useCallback(() => {
        if (step === 'context') {
            setStep('identity');
        }
    }, [step]);

    // スタジオ作成/更新
    const handleSave = useCallback(() => {
        const studioData: Partial<Studio> = {
            name: data.name || 'New Studio',
            icon: data.icon,
            themeColor: data.themeColor,
            description: data.description,
            systemPrompt: data.systemPrompt,
            inputPlaceholder: data.inputPlaceholder || 'メッセージを入力...',
            welcomeMessage: data.welcomeMessage || 'こんにちは！',
            knowledgeFiles: [],
        };

        if (isEditMode && editingStudio) {
            updateStudio(editingStudio.id, studioData);
        } else {
            createStudio(studioData);
        }

        // リセットして閉じる
        setData(initialData);
        setStep('identity');
        onClose();
    }, [data, createStudio, updateStudio, onClose, isEditMode, editingStudio]);

    // キャンセル
    const handleCancel = useCallback(() => {
        setData(initialData);
        setStep('identity');
        onClose();
    }, [onClose]);

    // バリデーション
    const canProceed = step === 'identity' ? data.name.trim().length > 0 : true;

    // ステップ表示
    const stepVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
        }),
    };

    const direction = step === 'identity' ? 0 : 1;

    // タイトル
    const getTitle = () => {
        if (isEditMode) {
            return step === 'identity' ? 'スタジオを編集' : 'コンテキスト設定';
        }
        return step === 'identity' ? 'スタジオを作成' : 'コンテキスト設定';
    };

    // React Portalを使用してdocument.bodyに直接レンダリング
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="wizard-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        className="wizard-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Header */}
                        <header className="wizard-header">
                            <div className="wizard-header__left">
                                {step === 'context' && (
                                    <motion.button
                                        className="wizard-back-btn"
                                        onClick={handleBack}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ x: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <ChevronLeft size={20} />
                                        戻る
                                    </motion.button>
                                )}
                            </div>

                            <div className="wizard-header__center">
                                <h2 className="wizard-title">
                                    {getTitle()}
                                </h2>
                            </div>

                            <div className="wizard-header__right">
                                <button
                                    className="wizard-close-btn"
                                    onClick={handleCancel}
                                    aria-label="閉じる"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </header>

                        {/* Progress */}
                        <div className="wizard-progress">
                            <div
                                className={`wizard-progress__step ${step === 'identity' ? 'active' : 'completed'}`}
                            />
                            <div
                                className={`wizard-progress__step ${step === 'context' ? 'active' : ''}`}
                            />
                        </div>

                        {/* Content */}
                        <div className="wizard-content">
                            <AnimatePresence mode="wait" custom={direction}>
                                {step === 'identity' ? (
                                    <motion.div
                                        key="identity"
                                        custom={direction}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <StepIdentity
                                            data={data}
                                            onChange={updateData}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="context"
                                        custom={direction}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <StepContext
                                            data={data}
                                            onChange={updateData}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <footer className="wizard-footer">
                            <button
                                className="wizard-btn wizard-btn--secondary"
                                onClick={handleCancel}
                            >
                                キャンセル
                            </button>

                            {step === 'identity' ? (
                                <button
                                    className="wizard-btn wizard-btn--primary"
                                    onClick={handleNext}
                                    disabled={!canProceed}
                                >
                                    次へ
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                <motion.button
                                    className="wizard-btn wizard-btn--primary wizard-btn--create"
                                    onClick={handleSave}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isEditMode ? (
                                        <>
                                            <Save size={16} />
                                            保存
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            作成
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default StudioWizardModal;

