// src/components/Settings/sections/PromptSettings.jsx
import React, { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';
import './SettingsComponents.css';

const PromptSettings = ({ settings, onUpdateSettings }) => {
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (settings?.prompt) {
      setSystemPrompt(settings.prompt.systemPrompt || '');
    }
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings('prompt', 'systemPrompt', systemPrompt);
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">システムプロンプト (Mock)</h3>
        <p className="settings-card-description">
          AIの振る舞いや制約事項を定義します。
          <br/>
          <span className="text-xs text-orange-500">
            ※ FEモードではシミュレーション用、RealモードではDify変数の上書きに使用されます（要API対応）。
          </span>
        </p>
      </div>

      <div className="settings-row">
        <div className="flex items-center justify-between">
            <label className="settings-label">System Prompt</label>
            <span className="text-xs text-[var(--color-text-sub)]">{systemPrompt.length} chars</span>
        </div>
        <textarea
          className="settings-textarea"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="あなたは優秀なAIアシスタントです。常に日本語で、丁寧に回答してください..."
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex gap-2 items-start text-xs text-blue-800">
         <Info size={14} className="mt-0.5 shrink-0" />
         <p>
            Difyの仕様上、システムプロンプトの動的な上書きは「会話変数（Conversation Variable）」機能を利用するか、
            API入力パラメータとして渡す必要があります。現在は設定値の保存のみ行います。
         </p>
      </div>

      <div className="settings-actions">
        <button className="settings-btn primary" onClick={handleSave}>
          <Save size={16} />
          <span>保存する</span>
        </button>
      </div>
    </div>
  );
};

export default PromptSettings;