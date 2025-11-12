import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

// F-UI-006, F-UI-007: モックモード切り替え用UI
// App.jsx から呼び出され、style.css の .mock-mode-select スタイルが適用されます
function MockModeSelect({ currentMode, onChange }) {
  
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className="mock-mode-select">
      <label htmlFor="mock-mode">
        <SlidersHorizontal size={14} />
        <span>PoC Debug Mode:</span>
      </label>
      <select id="mock-mode" value={currentMode} onChange={handleChange}>
        <option value="OFF">OFF (実API / Mode 3)</option>
        <option value="FE">FE Mock (Mode 1)</option>
        <option value="BE">BE Mock (Mode 2)</option>
      </select>
    </div>
  );
}

export default MockModeSelect;