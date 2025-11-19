// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './styles/ChatArea.css';

// --- アイコン定義 ---
const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

/**
 * 質問入力フォーム (ファイル添付対応版)
 * @param {boolean} isLoading
 * @param {function} onSendMessage - (text, file) => void
 * @param {boolean} isCentered
 */
const ChatInput = ({ isLoading, onSendMessage, isCentered = false }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // ファイル状態
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null); // 隠しinput用ref

  // テキストエリアの自動リサイズ
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputText]);

  // ファイル選択ハンドラ
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 必要に応じてここでサイズチェック等を行う (例: 15MB制限)
      setSelectedFile(file);
    }
  };

  // ファイル解除ハンドラ
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // inputもリセット
    }
  };

  // 送信ハンドラ
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    
    // テキストまたはファイルがあれば送信可能
    if ((text || selectedFile) && !isLoading) {
      onSendMessage(text, selectedFile);
      
      // 送信後のリセット
      setInputText('');
      handleRemoveFile();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const containerClassName = isCentered
    ? 'chat-input-container-centered'
    : 'chat-input-container';

  return (
    <div className={containerClassName}>
      {/* ファイルプレビュー (ファイルがある時だけ表示) */}
      {selectedFile && (
        <div className="file-preview-container" style={{ 
            padding: '6px 12px', 
            backgroundColor: '#f3f4f6', 
            borderTopLeftRadius: '8px', 
            borderTopRightRadius: '8px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: '#374151'
        }}>
            <span style={{ marginRight: '8px' }}>📄</span>
            <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedFile.name}
            </span>
            <button 
                type="button"
                onClick={handleRemoveFile}
                style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    cursor: 'pointer', 
                    color: '#9CA3AF',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                }}
            >
                ✕
            </button>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: '8px',
          backgroundColor: 'white',
          borderRadius: selectedFile ? '0 0 8px 8px' : '8px', // プレビューがある時は上角を直角に
          padding: '8px' // 内側の余白
      }}>
        {/* クリップボタン */}
        <button
          type="button"
          className="chat-input-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
          }}
        >
          <PaperclipIcon />
        </button>
        
        {/* 隠しファイル入力 */}
        <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            // Difyがサポートするドキュメント形式 (要件定義書準拠)
            accept=".pdf,.docx,.txt,.md,.pptx,.xlsx,.csv"
        />

        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "ファイルについて質問する..." : "質問を入力してください (Shift+Enterで改行)"}
          rows={1}
          disabled={isLoading}
        />
        
        <button
          type="submit"
          className="chat-input-button"
          disabled={isLoading || (!inputText.trim() && !selectedFile)}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;