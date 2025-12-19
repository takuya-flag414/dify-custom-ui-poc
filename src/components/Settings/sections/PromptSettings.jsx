// src/components/Settings/sections/PromptSettings.jsx
import React, { useState, useEffect } from 'react';
import { Save, Check, Zap, Sparkles, Info } from 'lucide-react';
import './SettingsComponents.css';

const AI_STYLES = [
  {
    id: 'efficient',
    label: '効率重視',
    icon: Zap,
    description: '結論を先に、簡潔に回答します'
  },
  {
    id: 'partner',
    label: '思考パートナー',
    icon: Sparkles,
    description: '丁寧に対話しながら一緒に考えます'
  }
];

const PromptSettings = ({ settings, onUpdateSettings }) => {
  const [aiStyle, setAiStyle] = useState('partner');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (settings?.prompt) {
      setAiStyle(settings.prompt.aiStyle || 'partner');
      setSystemPrompt(settings.prompt.systemPrompt || '');
    }
  }, [settings]);

  const handleSaveStyle = (newStyle) => {
    setAiStyle(newStyle);
    onUpdateSettings('prompt', 'aiStyle', newStyle);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleSavePrompt = () => {
    onUpdateSettings('prompt', 'systemPrompt', systemPrompt);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const hasPromptChanges = systemPrompt !== (settings?.prompt?.systemPrompt || '');

  return (
    <>
      {/* AI回答スタイル選択カード */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">AI回答スタイル</h3>
          <p className="settings-card-description">
            AIの回答の仕方を選択します。オンボーディングで設定した値を変更できます。
          </p>
        </div>

        <div className="settings-row">
          <div className="theme-card-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {AI_STYLES.map((style) => {
              const IconComponent = style.icon;
              const isActive = aiStyle === style.id;

              return (
                <button
                  key={style.id}
                  className={`theme-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSaveStyle(style.id)}
                  style={{ padding: 'var(--space-5)', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <IconComponent size={20} className="theme-card-icon" />
                    <span className="theme-card-label" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>
                      {style.label}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {style.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* システムプロンプトカード */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">追加指示（システムプロンプト）</h3>
          <p className="settings-card-description">
            AI回答スタイルに加えて、追加したい指示があれば入力してください。
          </p>
        </div>

        <div className="settings-row">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="settings-label">追加プロンプト</label>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {systemPrompt.length} 文字
            </span>
          </div>
          <textarea
            className="settings-textarea"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="例: 専門用語は使わずに説明してください。回答は箇条書きでお願いします..."
          />
        </div>

        <div className="settings-actions">
          <button
            className="settings-btn primary"
            onClick={handleSavePrompt}
            disabled={!hasPromptChanges}
            style={!hasPromptChanges ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {isSaved ? (
              <>
                <Check size={16} />
                <span>保存しました</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>保存する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default PromptSettings;