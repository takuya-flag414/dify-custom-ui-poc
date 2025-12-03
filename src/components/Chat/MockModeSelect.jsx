// src/components/Chat/MockModeSelect.jsx
import React from 'react';
// ★ .css のインポートを削除 (ChatArea.css が担当)
// import './styles/ChatArea.css'; 

/**
 * PoC用 モックモード切替UI (F-UI-006, F-UI-007)
 * @param {string} mockMode - 現在のモード ('OFF', 'FE', 'BE')
 * @param {function} setMockMode - モードを更新する関数
 */
const MockModeSelect = ({ mockMode, setMockMode }) => {
  return (
    // ★外側の <div className="mock-mode-select"> を削除し、Fragmentに変更
    <>
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
    </>
    // ★外側の </div> を削除
  );
};

export default MockModeSelect;