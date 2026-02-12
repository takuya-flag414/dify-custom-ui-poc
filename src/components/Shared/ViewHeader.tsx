import React from 'react';

// --- Icons ---
const ChevronLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

// --- Component ---
interface ViewHeaderProps {
    title: string;
    onBack: () => void;
    rightElement?: React.ReactNode;
}

const ViewHeader: React.FC<ViewHeaderProps> = ({ title, onBack, rightElement }) => (
    <div className="view-header">
        <button className="back-btn" onClick={onBack}>
            <ChevronLeftIcon />
            <span>{title}</span>
        </button>
        {rightElement && (
            <div className="header-right-element">
                {rightElement}
            </div>
        )}
    </div>
);

export default ViewHeader;
