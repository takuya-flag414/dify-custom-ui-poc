// src/components/MockModeSelect.jsx
import React from 'react';
import './styles/ChatArea.css';

/**
 * PoC用 モックモード切替UI (F-UI-006, F-UI-007)
 * @param {string} mockMode - 現在のモード ('OFF', 'FE', 'BE')
 * @param {function} setMockMode - モードを更新する関数
 */
const MockModeSelect = ({ mockMode, setMockMode }) => {
  return (
    <div className="mock-mode-select">
      <label htmlFor="mock-mode-selector">
        [PoCデバッグ用] モード:
      </label>
      <select
        id="mock-mode-selector"
        value={mockMode}
        onChange={(e) => setMockMode(e.target.value)}
      >
        <option value="OFF">OFF (API実効)</option>
        <option value="FE">FE Mock (フロント完結)</option>
        <option value="BE">BE Mock (Difyワークフロー)</option>
      </select>
    </div>
  );
};

export default MockModeSelect;