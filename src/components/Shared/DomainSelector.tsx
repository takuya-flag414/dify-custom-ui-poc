import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ViewHeader from './ViewHeader';
import './ContextSelector.css';

// --- Icons ---
const iconProps: React.SVGProps<SVGSVGElement> = {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
};

const GlobeAltIcon = () => (
    <svg {...iconProps}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M2 12h20"></path>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

// --- Types ---
interface DomainSelectorProps {
    onBack: () => void;
    filters: string[];
    onAddFilter: (domain: string) => void;
    onRemoveFilter: (index: number) => void;
    variants: any;
    initial: string;
    animate: string;
    exit: string;
    transition: any;
}

// --- Main Component ---
const DomainSelector: React.FC<DomainSelectorProps> = ({
    onBack,
    filters,
    onAddFilter,
    onRemoveFilter,
    variants,
    initial,
    animate,
    exit,
    transition
}) => {
    const [urlInput, setUrlInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleAdd = () => {
        if (!urlInput.trim()) return;
        try {
            const rawUrl = urlInput.trim();
            const safeUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
            const urlObj = new URL(safeUrl);
            let hostname = urlObj.hostname.replace(/^www\./, '');

            // Call parent handler
            onAddFilter(hostname);

            // Reset local state on success (parent can handle duplicate checks, but for UI feedback we assume success or handle logical checks here if needed)
            // It might be better to move duplicate check here to show error immediately.
            // But for now, let's assume if it comes back it's fine or we check effectively before calling.
            // Actually, the original code checked duplicates inside addFilter. Let's replicate strict logic here or trust parent?
            // "onAddFilter" implies action. 
            // Replicating the logic from original component for better UX (immediate feedback)
            if (filters.includes(hostname)) {
                // Duplicate check is redundant if parent does it effectively, but let's just clear input.
                // Actually, original code does NOTHING if included.
            }

            setUrlInput('');
            setErrorMsg('');
        } catch (e) {
            setErrorMsg('有効なURLを入力してください');
        }
    };

    // We do a small wrapper for add to separate parsing logic from parent if we want,
    // but the plan said "Logic for urlInput state validation... kept here".
    // So the onAddFilter expects a clean "hostname".

    return (
        <motion.div
            key="domains"
            variants={variants}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            className="view-content"
        >
            <ViewHeader title="戻る" onBack={onBack} />

            <div className="domain-input-row">
                <input
                    className="domain-input-field"
                    placeholder="example.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    autoFocus
                />
                <button
                    onClick={handleAdd}
                    disabled={!urlInput}
                    className="domain-add-btn"
                >
                    追加
                </button>
            </div>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            <p className="domain-help">
                特定のドメインを追加すると、そのサイト内のみを検索します。
            </p>
            <div className="domain-list">
                {filters.length === 0 ? (
                    <div className="domain-empty">
                        指定なし (Web全体を検索)
                    </div>
                ) : (
                    filters.map((filter, idx) => (
                        <div key={idx} className="domain-item">
                            <div className="domain-info">
                                <GlobeAltIcon />
                                <span>{filter}</span>
                            </div>
                            <button
                                onClick={() => onRemoveFilter(idx)}
                                className="domain-delete-btn"
                                title="削除"
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default DomainSelector;
