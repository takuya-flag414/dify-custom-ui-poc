// src/components/Settings/sections/PromptSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, Zap, Sparkles, User, Eye, ChevronDown, Briefcase, Building2 } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow } from './MacSettingsComponents';
import './SettingsCommon.css';
import './PromptSettings.css';

const AI_STYLES = [
  {
    id: 'efficient',
    label: '効率重視',
    icon: Zap,
    description: '結論を先に、簡潔に回答します。'
  },
  {
    id: 'partner',
    label: '思考パートナー',
    icon: Sparkles,
    description: '丁寧に対話しながら一緒に考えます。'
  }
];

// プレビュー文章（StepStyleSelect.jsxと同じ内容）
const STYLE_PREVIEWS = {
  efficient: {
    text: `### AIとは

**AI（人工知能）** は、人間の知的活動をコンピューターで再現する技術です。

### 主な種類
- **機械学習**: データからパターンを学習
- **深層学習**: ニューラルネットワークによる高度な処理
- **生成AI**: テキストや画像を生成

現在、業務効率化や意思決定支援に広く活用されています。`,
    tone: '簡潔・直接的',
    icon: '⚡'
  },
  partner: {
    text: `AIについてご質問ですね！🤖

AI（人工知能）は、人間の知的活動をコンピューターで再現する技術のことです。

最近話題の**ChatGPT**のような生成AIや、画像を作る**DALL-E**など、色々な種類があるんですよ✨

他にもAIについて気になることがあれば、お気軽に聞いてくださいね！`,
    tone: '対話的・丁寧',
    icon: '💭'
  }
};

const PromptSettings = ({ settings, onUpdateSettings }) => {
  const [aiStyle, setAiStyle] = useState('partner');
  // ★ v3.0: Intelligence Profile
  const [userProfile, setUserProfile] = useState({ role: '', department: '' });
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (settings?.prompt) {
      setAiStyle(settings.prompt.aiStyle || 'partner');
      // ★ v3.0: 新しいステート構造に対応
      setUserProfile(settings.prompt.userProfile || { role: '', department: '' });
      setCustomInstructions(settings.prompt.customInstructions || '');
    }
  }, [settings]);

  const handleSaveStyle = (newStyle) => {
    setAiStyle(newStyle);
    onUpdateSettings('prompt', 'aiStyle', newStyle);
  };

  // ★ v3.0: User Profile の更新
  const handleProfileChange = (field, value) => {
    const newProfile = { ...userProfile, [field]: value };
    setUserProfile(newProfile);
  };

  // ★ v3.0: Intelligence Profile 全体を保存
  const handleSaveProfile = () => {
    onUpdateSettings('prompt', 'userProfile', userProfile);
    onUpdateSettings('prompt', 'customInstructions', customInstructions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  // 変更検知
  const hasProfileChanges =
    JSON.stringify(userProfile) !== JSON.stringify(settings?.prompt?.userProfile || { role: '', department: '' }) ||
    customInstructions !== (settings?.prompt?.customInstructions || '');

  const currentPreview = STYLE_PREVIEWS[aiStyle] || STYLE_PREVIEWS.partner;

  return (
    <div className="settings-container">
      {/* === Section: AI Style === */}
      <MacSettingsSection title="AI Persona">
        <MacSettingsRow
          icon={Sparkles}
          label="回答スタイル"
          description="AIの振る舞いと性格を設定します"
        >
          <div className="mac-segmented">
            {AI_STYLES.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  className={`mac-segmented-item ${aiStyle === style.id ? 'active' : ''}`}
                  onClick={() => handleSaveStyle(style.id)}
                >
                  <Icon size={12} /> {style.label}
                </button>
              );
            })}
          </div>
        </MacSettingsRow>

        {/* Collapsible Preview inside AI Persona section */}
        <div className="style-preview-wrapper">
          <div
            className="style-preview-toggle"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          >
            <Eye size={14} />
            <span>回答イメージを見る</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={aiStyle}
                className="style-preview-badge"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {currentPreview.icon} {currentPreview.tone}
              </motion.span>
            </AnimatePresence>
            <motion.div
              className="style-preview-chevron"
              animate={{ rotate: isPreviewOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </div>
          <AnimatePresence>
            {isPreviewOpen && (
              <motion.div
                key={`preview-${aiStyle}`}
                className="style-preview-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="style-preview-text">
                  {currentPreview.text.split('\n').map((line, i) => {
                    const parseBold = (text) => {
                      const parts = text.split(/(\*\*[^*]+\*\*)/g);
                      return parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      });
                    };

                    if (line.startsWith('### ')) {
                      return <div key={i} className="preview-heading">{parseBold(line.replace('### ', ''))}</div>;
                    }
                    if (line.startsWith('- ')) {
                      return <div key={i} className="preview-list-item">{parseBold(line.replace('- ', '• '))}</div>;
                    }
                    if (line.trim() === '') {
                      return <div key={i} style={{ height: '8px' }} />;
                    }
                    return (
                      <p key={i} className="preview-paragraph">
                        {parseBold(line)}
                      </p>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MacSettingsSection>

      {/* === Section: Intelligence Profile === */}
      <MacSettingsSection title="Intelligence Profile">
        {/* User Identity Form */}
        <MacSettingsRow
          icon={User}
          label="あなたの情報"
          description="AIがあなたの背景を理解し、より適切な回答を提供できます"
        />

        <div className="intelligence-profile-form">
          <div className="ghost-input-group">
            <div className="ghost-input-row">
              <Briefcase size={14} className="ghost-input-icon" />
              <input
                type="text"
                className="ghost-input"
                placeholder="役職（例: 営業マネージャー）"
                value={userProfile.role}
                onChange={(e) => handleProfileChange('role', e.target.value)}
              />
            </div>
            <div className="ghost-input-row">
              <Building2 size={14} className="ghost-input-icon" />
              <input
                type="text"
                className="ghost-input"
                placeholder="部署 - 任意（例: 営業部）"
                value={userProfile.department}
                onChange={(e) => handleProfileChange('department', e.target.value)}
              />
            </div>
          </div>

          {/* Custom Instructions Editor */}
          <div className="custom-instructions-wrapper">
            <label className="custom-instructions-label">
              カスタム指示
            </label>
            <textarea
              className="custom-instructions-editor"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={`AIへの追加指示を自由に記述できます。

例:
・結論から述べてください
・専門用語は噛み砕いて説明してください
・回答は箇条書きでお願いします`}
            />
          </div>

          <div className="intelligence-profile-actions">
            <AnimatePresence>
              {isSaved && (
                <motion.span
                  className="save-indicator"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Check size={12} /> 保存しました
                </motion.span>
              )}
            </AnimatePresence>
            <button
              className="settings-btn primary"
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges}
              style={!hasProfileChanges ? { opacity: 0.5 } : {}}
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
      </MacSettingsSection>
    </div>
  );
};

export default PromptSettings;