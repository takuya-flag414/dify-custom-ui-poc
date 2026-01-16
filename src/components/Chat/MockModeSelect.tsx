// src/components/Chat/MockModeSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    ServerIcon,
    FlaskIcon,
    RobotIcon
} from '../Shared/SystemIcons';

/**
 * Chevronアイコン
 */
const ChevronDownIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

/**
 * チェックアイコン
 */
const CheckIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

/**
 * モックモードの型
 */
export type MockMode = 'OFF' | 'FE' | 'BE';

/**
 * モックオプションの型
 */
interface MockOption {
    value: MockMode;
    label: string;
    icon: React.FC<{ width?: string | number; height?: string | number }>;
}

const MOCK_OPTIONS: MockOption[] = [
    { value: 'OFF', label: 'Real API (OFF)', icon: ServerIcon },
    { value: 'FE', label: 'FE Mock', icon: FlaskIcon },
    { value: 'BE', label: 'BE Mock', icon: RobotIcon },
];

/**
 * MockModeSelect のProps型
 */
interface MockModeSelectProps {
    mockMode: MockMode;
    setMockMode: (mode: MockMode) => void;
}

/**
 * モックモード選択コンポーネント
 */
const MockModeSelect: React.FC<MockModeSelectProps> = ({ mockMode, setMockMode }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = MOCK_OPTIONS.find(opt => opt.value === mockMode) || MOCK_OPTIONS[0];
    const CurrentIcon = currentOption.icon;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: MockMode): void => {
        setMockMode(value);
        setIsOpen(false);
    };

    return (
        <div className="mock-mode-wrapper" ref={dropdownRef}>
            <button
                className={`mock-trigger-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="実行モード切り替え"
            >
                <div className="mock-trigger-icon">
                    <CurrentIcon width="14" height="14" />
                </div>
                <span>Mode: {currentOption.label}</span>
                <div className="mock-trigger-chevron">
                    <ChevronDownIcon />
                </div>
            </button>

            {isOpen && (
                <div className="mock-dropdown-menu">
                    {MOCK_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = mockMode === option.value;

                        return (
                            <button
                                key={option.value}
                                className={`mock-dropdown-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <div className="item-icon">
                                    <Icon width="16" height="16" />
                                </div>
                                <span className="item-label">{option.label}</span>
                                {isSelected && (
                                    <div className="item-check">
                                        <CheckIcon />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MockModeSelect;
