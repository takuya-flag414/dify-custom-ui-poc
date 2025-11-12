import React from 'react';
import { FileText, Lightbulb } from 'lucide-react';

// F-UI-003, F-UI-004: 個別のメッセージブロック
// ChatHistory.jsx から呼び出され、style.css の .message-block スタイルが適用されます
// ★本PoCの最重要検証コンポーネント (出典と提案の分離描画)
function MessageBlock({ message }) {
  const { type, text, citations, suggestedQuestions } = message;

  // ユーザーのメッセージかAIのメッセージかでスタイルを切り替える
  const isUser = type === 'user';
  const blockClassName = isUser ? 'message-block user' : 'message-block ai';
  const bubbleClassName = isUser ? 'message-bubble user' : 'message-bubble ai';

  // T-11: 提案ボタンクリック時の処理 (PoCではコンソールログ)
  const handleSuggestionClick = (question) => {
    console.log('Suggested Question Clicked:', question);
    // 将来的には onSend(question) などを呼び出す
  };

  return (
    <div className={blockClassName}>
      {/* メッセージ本体 (吹き出し) */}
      <div className={bubbleClassName}>
        {text}
      </div>

      {/* T-09: F-UI-003 (出典の分離・描画) */}
      {/* AIのメッセージかつ、出典が存在する場合のみ描画 */}
      {!isUser && citations && citations.length > 0 && (
        <div className="citations">
          {citations.map((cite, index) => (
            <span key={cite.id || `c-${index}`} className="citation-item">
              {/* --- 変更 (Icon) --- */}
              <FileText size={14} />
              {/* --- 変更ここまで --- */}
              {cite.source} {cite.page ? `(P. ${cite.page})` : ''}
            </span>
          ))}
        </div>
      )}

      {/* T-11: F-UI-004 (プロアクティブ提案の分離・描画) */}
      {/* AIのメッセージかつ、提案が存在する場合のみ描画 */}
      {!isUser && suggestedQuestions && suggestedQuestions.length > 0 && (
        <div className="suggested-questions">
          {suggestedQuestions.map((q, index) => (
            <button 
              key={`q-${index}`} 
              className="suggested-question-button"
              onClick={() => handleSuggestionClick(q)}
            >
              {/* --- 変更 (Icon) --- */}
              <Lightbulb size={16} />
              {/* 変更したアイコンに合わせてテキストをspanで囲む */}
              <span>{q}</span>
              {/* --- 変更ここまで --- */}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageBlock;