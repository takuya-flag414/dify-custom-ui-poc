import React from 'react';

/**
 * AIがプレゼンスライドを生成中であることを示すインラインSVGアニメーション。
 * 16:9のキャンバス上をAIの光（スパーク）が飛び回り、魔法のようにレイアウトを構築します。
 */
const GeneratingSlideAnimation = ({ className = "w-full max-w-md h-auto", style }) => {
  return (
    <svg
      viewBox="-20 -20 200 130"
      overflow="visible"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="generating-slide-svg-title"
    >
      <title id="generating-slide-svg-title">Now generating presentation slide...</title>

      <defs>
        {/* スライドキャンバス用の柔らかいドロップシャドウ */}
        <filter id="slide-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.08" />
        </filter>

        {/* AIスパーク用の発光（グロウ）エフェクト */}
        <filter id="spark-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* 軌跡とAIスパーク用のApple風グラデーション（ブルー -> パープル -> ピンク） */}
        <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0A84FF" />
          <stop offset="50%" stopColor="#AF52DE" />
          <stop offset="100%" stopColor="#FF2D55" />
        </linearGradient>

        {/* 要素に少しだけリッチな質感を持たせる薄いグラデーション */}
        <linearGradient id="skeleton-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#E5E7EB" />
        </linearGradient>
      </defs>

      <style>
        {`
          :root {
            /* スッと動いてゆっくり止まるApple風のイージング */
            --apple-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
            /* 要素が弾むようにポップアップするイージング */
            --apple-pop-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          /* キャンバス全体の脈動（生成中の動作感） */
          @keyframes ap-slide-canvas {
            0%, 5%    { transform: scale(1); }
            10%, 85%  { transform: scale(0.97); }
            95%, 100% { transform: scale(1); }
          }

          /* AIスパークの移動アニメーション */
          @keyframes ap-spark-move {
            0%   { offset-distance: 0%; opacity: 0; transform: scale(0.5); }
            5%   { opacity: 1; transform: scale(1); }
            80%  { offset-distance: 100%; opacity: 1; transform: scale(1); }
            85%  { offset-distance: 100%; opacity: 0; transform: scale(0.5); }
            100% { offset-distance: 0%; opacity: 0; transform: scale(0.5); }
          }

          /* 光の軌跡を描くアニメーション */
          @keyframes ap-trace-draw {
            0%   { stroke-dashoffset: 100; opacity: 0; }
            5%   { stroke-dashoffset: 100; opacity: 1; }
            80%  { stroke-dashoffset: 0; opacity: 1; }
            85%  { stroke-dashoffset: 0; opacity: 0; }
            100% { stroke-dashoffset: 100; opacity: 0; }
          }

          /* --- 以下、スライド各要素が順番にポップアップするアニメーション --- */
          /* スパークが通過した直後にポンッと現れるよう、タイミングを調整しています */
          
          @keyframes ap-pop-title {
            0%, 20%  { opacity: 0; transform: scale(0.8); }
            25%, 80% { opacity: 1; transform: scale(1); }
            85%, 100%{ opacity: 0; transform: scale(0.9); }
          }
          @keyframes ap-pop-img {
            0%, 35%  { opacity: 0; transform: scale(0.8); }
            40%, 80% { opacity: 1; transform: scale(1); }
            85%, 100%{ opacity: 0; transform: scale(0.9); }
          }
          @keyframes ap-pop-text1 {
            0%, 50%  { opacity: 0; transform: scale(0.8); }
            55%, 80% { opacity: 1; transform: scale(1); }
            85%, 100%{ opacity: 0; transform: scale(0.9); }
          }
          @keyframes ap-pop-text2 {
            0%, 58%  { opacity: 0; transform: scale(0.8); }
            63%, 80% { opacity: 1; transform: scale(1); }
            85%, 100%{ opacity: 0; transform: scale(0.9); }
          }
          @keyframes ap-pop-text3 {
            0%, 65%  { opacity: 0; transform: scale(0.8); }
            70%, 80% { opacity: 1; transform: scale(1); }
            85%, 100%{ opacity: 0; transform: scale(0.9); }
          }

          /* --- クラスの割り当て --- */
          .slide-canvas-group {
            transform-origin: 80px 45px; /* スライドの中心 */
            animation: ap-slide-canvas 3.5s var(--apple-ease-in-out) infinite;
          }
          .spark-trace {
            stroke-dasharray: 100 200; /* 描画100、間隔200に設定し、終端に次のダッシュの丸みが顔を出すのを防ぐ */
            animation: ap-trace-draw 3.5s var(--apple-ease-in-out) infinite;
          }
          .ai-spark-group {
            /* スライド上を飛び回る複雑なパス */
            offset-path: path("M -10 21 L 100 21 C 120 21, 100 55, 45 55 C 20 55, 70 39, 115 39 C 140 39, 80 53, 110 53 C 130 53, 80 67, 112 67 C 140 67, 160 80, 180 80");
            offset-rotate: 0deg;
            animation: ap-spark-move 3.5s var(--apple-ease-in-out) infinite;
          }

          /* ポップアップ要素（各要素の中心を基準にスケールさせる） */
          .pop-title { animation: ap-pop-title 3.5s var(--apple-pop-ease) infinite; transform-origin: 65px 21px; }
          .pop-img   { animation: ap-pop-img 3.5s var(--apple-pop-ease) infinite; transform-origin: 45px 55px; }
          .pop-text1 { animation: ap-pop-text1 3.5s var(--apple-pop-ease) infinite; transform-origin: 115px 39px; }
          .pop-text2 { animation: ap-pop-text2 3.5s var(--apple-pop-ease) infinite; transform-origin: 110px 53px; }
          .pop-text3 { animation: ap-pop-text3 3.5s var(--apple-pop-ease) infinite; transform-origin: 112.5px 67px; }
        `}
      </style>

      {/* --- 全体を揺らすキャンバスグループ --- */}
      <g className="slide-canvas-group">

        {/* 背景の白いスライド (160x90 = 16:9比率) */}
        <rect x="0" y="0" width="160" height="90" rx="8" fill="#FFFFFF" filter="url(#slide-shadow)" />

        {/* --- ポップアップするスライドの構成要素たち --- */}

        {/* タイトルバー */}
        <g className="pop-title">
          <rect x="15" y="15" width="100" height="12" rx="4" fill="url(#skeleton-grad)" />
        </g>

        {/* 左下の画像プレースホルダー */}
        <g className="pop-img">
          <rect x="15" y="35" width="60" height="40" rx="4" fill="url(#skeleton-grad)" />
          {/* 画像アイコン風の装飾（山と太陽を抽象化したもの） */}
          <circle cx="40" cy="48" r="6" fill="#D1D5DB" opacity="0.8" />
          <path d="M 15 75 L 35 55 L 50 68 L 60 60 L 75 75" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 右側の箇条書きテキスト（3行） */}
        <g className="pop-text1">
          <rect x="85" y="35" width="60" height="8" rx="4" fill="url(#skeleton-grad)" />
        </g>
        <g className="pop-text2">
          <rect x="85" y="49" width="50" height="8" rx="4" fill="url(#skeleton-grad)" />
        </g>
        <g className="pop-text3">
          <rect x="85" y="63" width="55" height="8" rx="4" fill="url(#skeleton-grad)" />
        </g>

        {/* --- AIによる魔法の軌跡 --- */}
        <path
          className="spark-trace"
          d="M -10 21 L 100 21 C 120 21, 100 55, 45 55 C 20 55, 70 39, 115 39 C 140 39, 80 53, 110 53 C 130 53, 80 67, 112 67 C 140 67, 160 80, 180 80"
          fill="none"
          stroke="url(#ai-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength="100"
        />

        {/* --- AIスパーク (動く光の球体) --- */}
        <g className="ai-spark-group">
          {/* ぼんやりとした外側のグロウ */}
          <circle cx="0" cy="0" r="8" fill="url(#ai-gradient)" opacity="0.5" filter="url(#spark-glow)" />
          {/* はっきりした内側の色 */}
          <circle cx="0" cy="0" r="4.5" fill="url(#ai-gradient)" />
          {/* 光のコア（白） */}
          <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
        </g>

      </g>
    </svg>
  );
};

export default GeneratingSlideAnimation;