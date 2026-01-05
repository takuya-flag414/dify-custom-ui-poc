// src/components/Settings/sections/MacSettingsComponents.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import './SettingsCommon.css';

/**
 * MacSettingsSection
 * Wrapper for a section of settings with a title.
 */
export const MacSettingsSection = ({ title, children }) => (
    <div className="settings-section">
        {title && <div className="settings-section-title">{title}</div>}
        <div className="settings-group">
            {children}
        </div>
    </div>
);

/**
 * MacSettingsRow
 * v3.0 Design System Grid Layout
 * [Icon] [Label + Desc] [Control]
 */
export const MacSettingsRow = ({ icon: Icon, label, description, children, isLast, danger, onClick }) => (
    <div
        className={`mac-settings-row ${danger ? 'danger' : ''}`}
        onClick={onClick}
        style={onClick ? { cursor: 'pointer' } : {}}
    >
        {/* Col 1: Icon */}
        <div className="settings-icon-col">
            <div className="settings-icon-box">
                {Icon && <Icon className={danger ? "text-danger" : ""} />}
            </div>
        </div>

        {/* Col 2: Label */}
        <div className="settings-label-col">
            <div className={`settings-label-text ${danger ? 'text-danger' : ''}`}>
                {label}
            </div>
            {description && (
                <div className="settings-description">
                    {description}
                </div>
            )}
        </div>

        {/* Col 3: Control */}
        <div className="settings-control-col">
            {children}
        </div>
    </div>
);

/**
 * MacStatsGrid (New for Admin)
 * 統計情報をグリッド状に表示する行コンポーネント
 */
export const MacStatsGrid = ({ children }) => (
    <div className="mac-settings-grid-row">
        {children}
    </div>
);

/**
 * MacStatsItem (New for Admin)
 * 個別の統計情報セル
 */
export const MacStatsItem = ({ icon: Icon, label, value, trend }) => (
    <div className="mac-stats-item">
        <div className="mac-stats-icon-wrapper">
            {Icon && <Icon size={16} />}
        </div>
        <div className="mac-stats-content">
            <div className="mac-stats-label">{label}</div>
            <div className="mac-stats-value">{value}</div>
            {trend && <div className="mac-stats-trend">{trend}</div>}
        </div>
    </div>
);

/**
 * MacSelect
 * A polished custom select component with mac-style dropdown.
 */
export const MacSelect = ({ value, onChange, options, className = "", style = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Find label for current value
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const handleSelect = (newValue) => {
        onChange({ target: { value: newValue } }); // Mimic event object
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div
            className={`mac-select-wrapper ${isOpen ? 'open' : ''} ${className}`}
            style={style}
            ref={wrapperRef}
        >
            {/* Trigger */}
            <div
                className="mac-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="mac-select-value">{selectedOption?.label}</span>
                <ChevronsUpDown size={14} className="mac-select-icon" />
            </div>

            {/* Dropdown - relative positioned */}
            {isOpen && (
                <div className="mac-select-dropdown">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`mac-select-option ${opt.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            <span>{opt.label}</span>
                            {opt.value === value && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};