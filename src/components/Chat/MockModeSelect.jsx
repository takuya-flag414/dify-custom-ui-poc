// src/components/Chat/MockModeSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  ServerIcon,
  FlaskIcon,
  RobotIcon
} from '../Shared/SystemIcons';

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const MOCK_OPTIONS = [
  { value: 'OFF', label: 'Real API (OFF)', icon: ServerIcon },
  { value: 'FE', label: 'FE Mock', icon: FlaskIcon },
  { value: 'BE', label: 'BE Mock', icon: RobotIcon },
];

const MockModeSelect = ({ mockMode, setMockMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 現在の選択オプションを取得
  const currentOption = MOCK_OPTIONS.find(opt => opt.value === mockMode) || MOCK_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  // 外側クリック検知
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    setMockMode(value);
    setIsOpen(false);
  };

  return (
    <div className="mock-mode-wrapper" ref={dropdownRef}>
      {/* Trigger Button */}
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

      {/* Dropdown Menu */}
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