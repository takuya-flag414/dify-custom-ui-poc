// src/components/Shared/FileIcon.jsx
import React from 'react';

/**
 * 拡張子に応じたファイルアイコンを表示するコンポーネント
 * @param {string} filename - ファイル名 (例: "report.pdf")
 * @param {string} className - 追加のCSSクラス
 */
const FileIcon = ({ filename, className = "w-6 h-6" }) => {
  const ext = filename ? filename.split('.').pop().toLowerCase() : '';

  // カラーパレット (Tailwind/Apple System Colors 近似)
  const colors = {
    pdf: { bg: '#FEE2E2', text: '#EF4444', label: 'PDF' },       // Red-100/500
    xls: { bg: '#D1FAE5', text: '#10B981', label: 'XLS' },       // Green-100/500
    xlsx: { bg: '#D1FAE5', text: '#10B981', label: 'XLS' },
    csv: { bg: '#D1FAE5', text: '#10B981', label: 'CSV' },
    doc: { bg: '#DBEAFE', text: '#3B82F6', label: 'DOC' },       // Blue-100/500
    docx: { bg: '#DBEAFE', text: '#3B82F6', label: 'DOC' },
    ppt: { bg: '#FEF3C7', text: '#F59E0B', label: 'PPT' },       // Amber-100/500
    pptx: { bg: '#FEF3C7', text: '#F59E0B', label: 'PPT' },
    jpg: { bg: '#EDE9FE', text: '#8B5CF6', label: 'IMG' },       // Violet-100/500
    jpeg: { bg: '#EDE9FE', text: '#8B5CF6', label: 'IMG' },
    png: { bg: '#EDE9FE', text: '#8B5CF6', label: 'IMG' },
    txt: { bg: '#F3F4F6', text: '#6B7280', label: 'TXT' },       // Gray-100/500
    md: { bg: '#F3F4F6', text: '#111827', label: 'MD' },         // Gray-100/900
    default: { bg: '#F3F4F6', text: '#9CA3AF', label: 'FILE' }   // Gray-100/400
  };

  const style = colors[ext] || colors.default;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '24px', height: '24px' }} // デフォルトサイズ
    >
      {/* ベースの紙 (白背景 + 影) */}
      <path
        d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
        fill="white"
        stroke="#E5E7EB"
        strokeWidth="1"
      />

      {/* 折り返し部分 */}
      <path
        d="M14 2V8H20"
        fill="#F3F4F6"
        stroke="#E5E7EB"
        strokeWidth="1"
      />

      {/* 拡張子バッジ (背景色) */}
      <rect
        x="5.5"
        y="11"
        width="13"
        height="7"
        rx="1"
        fill={style.bg}
      />

      {/* 拡張子テキスト */}
      <text
        x="12"
        y="15.5"
        fontFamily="sans-serif"
        fontSize="5"
        fontWeight="bold"
        fill={style.text}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {style.label}
      </text>
    </svg>
  );
};

export default FileIcon;