import React from 'react';

/**
 * Apple風の洗練されたアニメーションSVGコンポーネント
 * 白を基調とし、滑らかなグラデーション軌跡と上品なイージングを使用しています。
 */
const GeneratingAnimation = ({ className = "w-full max-w-xs h-auto", style }) => {
  return (
    <svg
      viewBox="-15 -15 130 130"
      overflow="visible"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="generating-svg-title"
    >
      <title id="generating-svg-title">Now generating...</title>

      <defs>
        {/* キャンバス用の柔らかく広いドロップシャドウ */}
        <filter id="apple-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.08" />
        </filter>

        {/* 緑色の鉛筆ボディ用グラデーション (六角形の立体感) */}
        <linearGradient id="green-pencil-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2E7D32" />
          <stop offset="30%" stopColor="#4CAF50" />
          <stop offset="70%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>

        {/* 金具用グラデーション */}
        <linearGradient id="ferrule-metal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9E9E9E" />
          <stop offset="50%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#757575" />
        </linearGradient>

        {/* 軌跡のグラデーション (Apple風の鮮やかな色合い) */}
        <linearGradient id="trace-color" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0A84FF" />   {/* ブルー */}
          <stop offset="50%" stopColor="#AF52DE" />  {/* パープル */}
          <stop offset="100%" stopColor="#FF2D55" /> {/* ピンク */}
        </linearGradient>

        {/* 魔法のミックス芯用グラデーション (新規追加) */}
        <linearGradient id="rainbow-lead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A84FF" />
          <stop offset="50%" stopColor="#AF52DE" />
          <stop offset="100%" stopColor="#FF2D55" />
        </linearGradient>
      </defs>

      <style>
        {`
          /* 洗練されたイージング（スッと動いてゆっくり止まる） */
          :root {
            --apple-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
          }

          /* キャンバスの動き: ペンが触れている間、かすかに奥へ沈み込む */
          @keyframes ap-canvas {
            0%, 5%    { transform: scale(1); }
            10%, 85%  { transform: scale(0.97); }
            95%, 100% { transform: scale(1); }
          }

          /* 軌跡の動き: ひと筆書きで描かれ、フワッと消える */
          @keyframes ap-line {
            0%, 9.9%  { stroke-dashoffset: 101; opacity: 0; } /* 描画開始直前まで非表示にして右側の点を消す */
            10%       { stroke-dashoffset: 101; opacity: 1; }
            85%       { stroke-dashoffset: 0; opacity: 1; }
            90%       { stroke-dashoffset: 0; opacity: 0; }
            100%      { stroke-dashoffset: 101; opacity: 0; }
          }

          /* ペンの動き: パスに沿って移動し、ズレを完全に無くす */
          @keyframes ap-pencil-move {
            0%   { offset-distance: 0%; transform: rotate(50deg) translateY(-15px) scale(1.05); opacity: 0; }
            5%   { opacity: 1; }
            10%  { offset-distance: 0%; transform: rotate(50deg) translateY(0) scale(1); } /* 接地 */
            
            85%  { offset-distance: 100%; transform: rotate(50deg) translateY(0) scale(1); opacity: 1; } /* 描き終わり */
            
            90%  { offset-distance: 100%; transform: rotate(50deg) translateY(-15px) scale(1.05); opacity: 0; } /* 離陸・フェードアウト */
            100% { offset-distance: 0%; transform: rotate(50deg) translateY(-15px) scale(1.05); opacity: 0; }
          }

          .apple-canvas-group {
            transform-origin: 50px 50px;
            animation: ap-canvas 2.5s var(--apple-ease-in-out) infinite;
          }

          .apple-trace {
            stroke-dasharray: 101; /* 先端の丸みがはみ出ないよう余裕を持たせる */
            animation: ap-line 2.5s var(--apple-ease-in-out) infinite;
          }

          .apple-pencil-group {
            transform-origin: 0 0; /* ペン先をパスの基準点にする */
            offset-path: path("M 25 50 C 40 25, 60 75, 75 50"); /* パスと全く同じ軌道を設定 */
            offset-rotate: 0deg; /* ペンの角度を自動回転させず維持 */
            animation: ap-pencil-move 2.5s var(--apple-ease-in-out) infinite;
          }
        `}
      </style>

      {/* --- Canvas (白いパネル) --- */}
      <g className="apple-canvas-group">
        <rect
          x="10"
          y="25"
          width="80"
          height="50"
          rx="12"
          fill="#FFFFFF"
          filter="url(#apple-shadow)"
        />
      </g>

      {/* --- Writing Trace (色鮮やかな軌跡) --- */}
      <path
        className="apple-trace"
        d="M 25 50 C 40 25, 60 75, 75 50"
        fill="none"
        stroke="url(#trace-color)"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength="100"
      />

      {/* --- Pencil (緑色の鉛筆・Apple風モダンアレンジ) --- */}
      <g className="apple-pencil-group">
        {/* ペン自身の微かなドロップシャドウ */}
        <rect x="-2.5" y="-45" width="5" height="40" rx="2" fill="#000000" opacity="0.1" filter="blur(1px)" transform="translate(1, 2)" />

        {/* 削り出された木の部分 (マットな質感) */}
        <polygon points="-2.5,-8 2.5,-8 0,0" fill="#E8C396" />
        {/* 木の部分の右半分のシャドウで立体感を強調 */}
        <polygon points="0,-8 2.5,-8 0,0" fill="#D4A771" />

        {/* 魔法の虹色ミックス芯 */}
        <polygon points="-1,-2.5 1,-2.5 0,0" fill="url(#rainbow-lead)" />

        {/* ペンのボディ (緑色・六角形を意識したハイライト) */}
        <rect x="-2.5" y="-35" width="5" height="27" fill="url(#green-pencil-body)" />
        {/* エッジのハイライト（六角形の角） */}
        <line x1="-1" y1="-35" x2="-1" y2="-8" stroke="#81C784" strokeWidth="0.5" opacity="0.6" />
        <line x1="1" y1="-35" x2="1" y2="-8" stroke="#A5D6A7" strokeWidth="0.5" opacity="0.8" />

        {/* 金具 (Ferrule) */}
        <rect x="-2.5" y="-39" width="5" height="4" fill="url(#ferrule-metal)" />

        {/* 消しゴム (マットなピンク) */}
        <rect x="-2.5" y="-45" width="5" height="6" rx="1.5" fill="#F48FB1" />
        {/* 消しゴムの右半分のシャドウ */}
        <rect x="0" y="-45" width="2.5" height="6" rx="1.5" fill="#F06292" opacity="0.5" />
      </g>
    </svg>
  );
};

export default GeneratingAnimation;