// src/utils/pptx/themes/modern-indigo/slides/SystemArchitectureSlide.ts
import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * SystemArchitectureSlideRenderer - システム構成図 PPTX エクスポートレンダラー
 * 
 * デザイン意図:
 * React UIの座標追跡と完全に一致した、数学的絶対配置エンジンを搭載。
 * レイヤーの背景、左端ラベルバッジ、ノードカード、および
 * 直角S字クランク接続線を 1px の狂いもなく PowerPoint 上で完全再現します。
 */
export class SystemArchitectureSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, tiers = [], nodes = [], connections = [], annotations = [] } = content;

    if (!tiers.length || !nodes.length) {
      this.ui.renderSlideHeader(slide, title || 'System Architecture');
      this.ui.renderFooterAnnotations(slide, annotations);
      return;
    }

    // --- 1. ヘッダー描画 (他スライドと完全に同一の固定位置) ---
    const startY = this.config.layout.headerTotalH; // 1.1 インチ (固定)
    this.ui.renderSlideHeader(slide, title || 'System Architecture');

    const baseX = this.config.layout.baseX; // 0.5 インチ (固定)
    const safeW = this.config.layout.safeW; // 9.0 インチ (固定)
    const totalH = 3.8;                     // スライド内有効高さ (5.1 - 1.1 = 4.0 からバッファを引き 3.8)

    // スケマティックカラー設計 (Reactと100%同一のカラーマッピング)
    const tierColors: { [key: string]: { bg: string, border: string, text: string } } = {
      blue: { bg: 'DBEAFE', border: '3B82F6', text: '1E40AF' },
      indigo: { bg: 'E0E7FF', border: '6366F1', text: '3730A3' },
      emerald: { bg: 'D1FAE5', border: '10B981', text: '065F46' },
      purple: { bg: 'F3E8FF', border: 'A855F7', text: '6B21A8' }
    };

    const nodeTypeConfigs: { [key: string]: { bg: string, text: string, border: string, badge: string } } = {
      client: { bg: 'EFF6FF', text: '1E40AF', border: 'BFDBFE', badge: '🖥️ CLIENT' },
      frontend: { bg: 'F5F3FF', text: '5B21B6', border: 'DDD6FE', badge: '💻 WEB UI' },
      gateway: { bg: 'F1F5F9', text: '334155', border: 'E2E8F0', badge: '⚙️ GATEWAY' },
      service: { bg: 'ECFDF5', text: '065F46', border: 'A7F3D0', badge: '📦 SERVICE' },
      database: { bg: 'FAF5FF', text: '6B21A8', border: 'E9D5FF', badge: '💾 DATABASE' },
      external: { bg: 'FEF3C7', text: '92400E', border: 'FDE68A', badge: '🌐 EXT API' }
    };

    const lineColors: { [key: string]: string } = {
      primary: this.config.colors.primary,
      blue: '3B82F6',
      purple: '8B5CF6',
      green: '10B981',
      default: this.config.colors.primary
    };

    // レアウト構成値 (インチ)
    const tierColW = 1.4;                 // 左端のレイヤー名バッジ用幅
    const nodesAreaW = safeW - tierColW;  // 7.6 インチ
    const tierCount = tiers.length;
    const tierRowH = totalH / tierCount;

    // 動的スケーリング (階層数に基づく)
    const tierScale = Math.max(0.45, 4 / Math.max(4, tierCount));
    const tierLabelFontSize = Math.max(6.5, 9.5 * tierScale);

    // =========================================================
    // 📐 事前座標マップ計算 (ノード接続のための絶対座標辞書)
    // =========================================================
    const nodeCoords: { [key: string]: { cx: number, cy: number, cardW: number, cardH: number } } = {};
    const nodeCardW = 1.15; // ノードカードの幅
    const nodeCardH = 0.55; // ノードカードの高さ

    tiers.forEach((tier: any, tierIdx: number) => {
      const tierNodes = nodes.filter((n: any) => n.tier === tier.id);
      const N = tierNodes.length;

      tierNodes.forEach((node: any, k: number) => {
        // 水平位置の等間隔配置のX中心座標計算
        const cx = baseX + tierColW + ((k + 0.5) * (nodesAreaW / N));
        const cy = startY + (tierIdx + 0.5) * tierRowH;
        
        nodeCoords[node.id] = {
          cx: cx,
          cy: cy,
          cardW: nodeCardW,
          cardH: nodeCardH
        };
      });
    });

    // =========================================================
    // 🌟 Z-Order レイヤー描画
    // =========================================================

    // --- 🌟 Z-Order LAYER 1: 最背面にレイヤー水平背景を描画 (transparency: 96 / 枠線排除) ---
    tiers.forEach((tier: any, tierIdx: number) => {
      const col = tierColors[tier.color] || tierColors.blue;
      const y = startY + tierIdx * tierRowH;

      slide.addShape(this.pptx.ShapeType.rect, {
        x: baseX + tierColW,
        y: y,
        w: nodesAreaW,
        h: tierRowH,
        fill: { color: col.bg, transparency: 96 },
        line: { color: col.bg, width: 0 } // 同じ背景色 ＆ 幅0 でデフォルト枠線を完璧に抹消！
      });
    });

    // --- 🌟 Z-Order LAYER 2: レーン区切り水平線 (ShapeType.line による 0.5pt 極細グレー直線 - 最終行除外) ---
    // 👈 接続線やテキストマスクより前に（最背面に近く）描画することで、テキストが線で上書きされるのを完全に防ぎます！
    tiers.forEach((tier: any, tierIdx: number) => {
      const y = startY + tierIdx * tierRowH;
      if (tierIdx < tierCount - 1) {
        slide.addShape(this.pptx.ShapeType.line, {
          x: baseX,
          y: y + tierRowH,
          w: safeW,
          h: 0,
          line: { color: 'E2E8F0', width: 0.5 }
        });
      }
    });

    // --- 🌟 Z-Order LAYER 3: 接続線の描画 (垂直線 ＆ 水平屈折線) ---
    connections.forEach((conn: any) => {
      const c1 = nodeCoords[conn.from];
      const c2 = nodeCoords[conn.to];
      if (!c1 || !c2) return;

      const x1 = c1.cx;
      const y1 = c1.cy;
      const x2 = c2.cx;
      const y2 = c2.cy;

      const color = lineColors[conn.color] || lineColors.default;
      const isDashed = conn.style === 'dashed';
      const lineWidth = 1.0;
      const dashType = isDashed ? 'dash' : 'solid';

      // 階層間のS字直角クランク接続線の描画
      const midY = (y1 + y2) / 2;

      // 3-a. 出発側垂直線 (中心から中点Yまで)
      slide.addShape(this.pptx.ShapeType.line, {
        x: x1,
        y: Math.min(y1, midY),
        w: 0,
        h: Math.abs(midY - y1),
        line: { color: color, width: lineWidth, dashType: dashType }
      });

      // 3-b. 水平折れ曲がり線 (X1からX2まで)
      slide.addShape(this.pptx.ShapeType.line, {
        x: Math.min(x1, x2),
        y: midY,
        w: Math.abs(x2 - x1),
        h: 0,
        line: { color: color, width: lineWidth, dashType: dashType }
      });

      // 3-c. 到着側垂直線 (中点YからX2中心まで)
      slide.addShape(this.pptx.ShapeType.line, {
        x: x2,
        y: midY,
        w: 0,
        h: y2 - midY,
        line: { color: color, width: lineWidth, dashType: dashType }
      });
    });

    // --- 🌟 Z-Order LAYER 4: 白背景付きプロトコル名ラベルの描画 (接続線の真上にマウントされるマスク) ---
    // 👈 接続線が引き終わった後に描画されるため、白マスクが接続線を完璧に上書きして文字を浮かび上がらせます！
    connections.forEach((conn: any) => {
      const c1 = nodeCoords[conn.from];
      const c2 = nodeCoords[conn.to];
      if (!c1 || !c2 || !conn.label) return;

      const x1 = c1.cx;
      const y1 = c1.cy;
      const x2 = c2.cx;
      const y2 = c2.cy;

      const color = lineColors[conn.color] || lineColors.default;
      const midY = (y1 + y2) / 2;

      const labelW = 0.55;
      const labelH = 0.16;

      slide.addText(conn.label, {
        x: (x1 + x2) / 2 - labelW / 2,
        y: midY - labelH / 2,
        w: labelW,
        h: labelH,
        fontSize: 4.5,
        bold: true,
        color: color,
        align: 'center',
        valign: 'middle',
        fill: { color: 'FFFFFF' },                  // 白背景マスク効果を確実に前面で発揮
        line: { color: color, width: 0.5 },          // 極細0.5pt枠線
        margin: 0
      });
    });

    // --- 🌟 Z-Order LAYER 5: レイヤー名バッジ ＆ ノードカード (最前面でマスク効果を発揮) ---
    tiers.forEach((tier: any, tierIdx: number) => {
      const col = tierColors[tier.color] || tierColors.blue;
      const y = startY + tierIdx * tierRowH;

      // A. レイヤーバッジの描画 (左端カラムに左詰めマウント)
      const bx = baseX + 0.1;
      const bh = Math.min(0.24, tierRowH * 0.4);
      const by = y + (tierRowH - bh) / 2;
      const bw = 1.2;

      slide.addShape(this.pptx.ShapeType.roundRect, {
        x: bx,
        y: by,
        w: bw,
        h: bh,
        fill: { color: col.bg },
        line: { color: col.border, width: 0.5 },
        rectRadius: 0.04
      });

      slide.addText(tier.label || '', {
        x: bx,
        y: by,
        w: bw,
        h: bh,
        fontSize: tierLabelFontSize,
        bold: true,
        color: col.text,
        align: 'center',
        valign: 'middle',
        margin: 0
      });

      // C. 所属するノードカードの描画 (接続線の末端を完全に隠す)
      const tierNodes = nodes.filter((n: any) => n.tier === tier.id);
      tierNodes.forEach((node: any) => {
        const coords = nodeCoords[node.id];
        if (!coords) return;

        const typeInfo = nodeTypeConfigs[node.type] || { bg: 'FFFFFF', text: '334155', border: 'E2E8F0', badge: 'NODE' };

        const nx = coords.cx - coords.cardW / 2;
        const ny = coords.cy - coords.cardH / 2;

        // C-1. 白背景のノードカード本体
        slide.addShape(this.pptx.ShapeType.roundRect, {
          x: nx,
          y: ny,
          w: coords.cardW,
          h: coords.cardH,
          fill: { color: 'FFFFFF' },                  // 透過させない白背景
          line: { color: 'E2E8F0', width: 0.5 },       // 0.5pt 極細薄グレー枠線
          rectRadius: 0.03
        });

        // C-2. カード上部: ノードタイプ極小バッジ
        const badgeW = 0.75;
        const badgeH = 0.12;
        const badgeX = coords.cx - badgeW / 2;
        const badgeY = ny + 0.05;

        slide.addShape(this.pptx.ShapeType.roundRect, {
          x: badgeX,
          y: badgeY,
          w: badgeW,
          h: badgeH,
          fill: { color: typeInfo.bg },
          line: { color: typeInfo.border, width: 0.5 },
          rectRadius: 0.05
        });

        slide.addText(typeInfo.badge, {
          x: badgeX,
          y: badgeY,
          w: badgeW,
          h: badgeH,
          fontSize: 4.0,
          bold: true,
          color: typeInfo.text,
          align: 'center',
          valign: 'middle',
          margin: 0
        });

        // C-3. カード中央: ノード名
        slide.addText(node.label || '', {
          x: nx + 0.05,
          y: ny + 0.2,
          w: coords.cardW - 0.1,
          h: coords.cardH - 0.22,
          fontSize: 6.5,
          bold: true,
          color: '334155',
          align: 'center',
          valign: 'middle',
          margin: 0
        });
      });
    });

    // --- 4. フッター注釈描画 (他スライドと共通位置) ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
