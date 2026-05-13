import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WIZARD_TEMPLATES } from './PromptWizardConfig';
import './PromptWizardModal.css';

interface PromptWizardModalProps {
    wizardId: string | null;
    onClose: () => void;
    onComplete: (prompt: string, addMenu: string | null, context: any | null) => void;
}

// --- Icons ---
const PresentationIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <path d="M10 8l4 3-4 3V8z" fill="currentColor" fillOpacity="0.2" />
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
    </svg>
);

const LayersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

const SparklesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
);

const ListChecksIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 6l2 2 4-4" />
        <path d="M11 18l2 2 4-4" />
        <path d="M3 6h4" />
        <path d="M3 12h4" />
        <path d="M3 18h4" />
        <path d="M11 12h10" />
    </svg>
);

const PromptWizardModal: React.FC<PromptWizardModalProps> = ({ wizardId, onClose, onComplete }) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);

    const template = wizardId ? WIZARD_TEMPLATES[wizardId] : null;

    useEffect(() => {
        if (template) {
            const initialAnswers: Record<string, any> = {};
            template.fields.forEach(f => {
                if (f.type === 'multi-select') {
                    initialAnswers[f.id] = [];
                } else if (f.type === 'select' || f.type === 'radio') {
                    initialAnswers[f.id] = f.options?.[0] || '';
                } else {
                    initialAnswers[f.id] = '';
                }
            });
            setAnswers(initialAnswers);
            setCurrentStep(0);
        }
    }, [template]);

    if (!template) return null;

    const fields = template.fields;
    const isLastStep = currentStep === fields.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            const prompt = template.generatePrompt(answers);
            onComplete(prompt, template.targetAddMenu, template.targetContext);
        } else {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        } else {
            onClose();
        }
    };

    const handleInputChange = (id: string, value: any) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const toggleMultiSelect = (id: string, option: string) => {
        setAnswers(prev => {
            const current = (prev[id] as string[]) || [];
            if (current.includes(option)) {
                return { ...prev, [id]: current.filter(o => o !== option) };
            } else {
                return { ...prev, [id]: [...current, option] };
            }
        });
    };

    const currentField = fields[currentStep];

    const stepVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0,
            filter: 'blur(4px)'
        }),
        center: {
            x: 0,
            opacity: 1,
            filter: 'blur(0px)',
            transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -50 : 50,
            opacity: 0,
            filter: 'blur(4px)',
            transition: { duration: 0.2 }
        })
    };

    return ReactDOM.createPortal(
        <motion.div 
            className="prompt-wizard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div 
                className="prompt-wizard-modal ai-hud-panel"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            >
                <div className="prompt-wizard-progress">
                    {fields.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`prompt-wizard-progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                <div className="prompt-wizard-header">
                    <div className="prompt-wizard-icon-badge">
                        <PresentationIcon />
                    </div>
                    <h2 className="prompt-wizard-title">{template.title}</h2>
                    <p className="prompt-wizard-desc">
                        ステップ {currentStep + 1} / {fields.length}
                    </p>
                </div>

                <div className="prompt-wizard-body-wrapper">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div 
                            key={currentStep}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="prompt-wizard-step"
                        >
                            <div className="prompt-wizard-field">
                                <div className="prompt-wizard-label-row">
                                    <span className="prompt-wizard-field-icon">
                                        {currentField.id === 'target' && <UsersIcon />}
                                        {currentField.id === 'volume' && <LayersIcon />}
                                        {currentField.id === 'tone' && <SparklesIcon />}
                                        {currentField.id === 'constraints' && <ListChecksIcon />}
                                        {currentField.id === 'custom_constraints' && <SparklesIcon />}
                                    </span>
                                    <label className="prompt-wizard-label">
                                        {currentField.label} {currentField.required && <span className="prompt-wizard-required-star">*</span>}
                                    </label>
                                </div>
                                
                                {currentField.type === 'text' && (
                                    <input 
                                        type="text" 
                                        autoFocus
                                        className="prompt-wizard-input"
                                        placeholder={currentField.placeholder}
                                        value={answers[currentField.id] || ''}
                                        onChange={(e) => handleInputChange(currentField.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && answers[currentField.id] && handleNext()}
                                    />
                                )}

                                {currentField.type === 'textarea' && (
                                    <textarea 
                                        autoFocus
                                        className="prompt-wizard-textarea"
                                        placeholder={currentField.placeholder}
                                        value={answers[currentField.id] || ''}
                                        onChange={(e) => handleInputChange(currentField.id, e.target.value)}
                                        rows={4}
                                    />
                                )}

                                {currentField.type === 'select' && (
                                    <div className="prompt-wizard-select-wrapper">
                                        <select 
                                            className="prompt-wizard-select"
                                            value={answers[currentField.id] || ''}
                                            onChange={(e) => handleInputChange(currentField.id, e.target.value)}
                                        >
                                            {currentField.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {currentField.type === 'radio' && (
                                    <div className="prompt-wizard-radio-list">
                                        {currentField.options?.map(opt => (
                                            <label key={opt} className={`prompt-wizard-radio-card ${answers[currentField.id] === opt ? 'active' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name={currentField.id}
                                                    value={opt}
                                                    checked={answers[currentField.id] === opt}
                                                    onChange={(e) => handleInputChange(currentField.id, e.target.value)}
                                                    className="prompt-wizard-radio-hidden"
                                                />
                                                <div className="prompt-wizard-radio-circle" />
                                                <span className="prompt-wizard-radio-text">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {currentField.type === 'multi-select' && (
                                    <div className="prompt-wizard-chip-grid">
                                        {currentField.options?.map(opt => (
                                            <button 
                                                key={opt}
                                                type="button"
                                                className={`prompt-wizard-chip ${answers[currentField.id]?.includes(opt) ? 'active' : ''}`}
                                                onClick={() => toggleMultiSelect(currentField.id, opt)}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="prompt-wizard-footer">
                    <button className="prompt-wizard-btn-back" onClick={handleBack}>
                        {currentStep === 0 ? 'キャンセル' : '戻る'}
                    </button>
                    <button 
                        className={`prompt-wizard-btn-next ${isLastStep ? 'submit' : ''}`} 
                        onClick={handleNext}
                        disabled={currentField.required && !answers[currentField.id]}
                    >
                        <span className="prompt-wizard-btn-submit-text">
                            {isLastStep ? 'セットする' : '次へ'}
                        </span>
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default PromptWizardModal;
