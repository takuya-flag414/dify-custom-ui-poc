// src/utils/pptx/themes/modern-indigo/slides/OrgChartSlide.ts
import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * OrgChartSlideRenderer - プロジェクト体制図・組織図 PPTX レンダラー
 * 
 * デザイン意図:
 * React UIと100%同一の動的階層ツリー座標エンジンを搭載。
 * 影を一切排した極細枠線のフラットカードを等間隔配置し、
 * 最大横並び数に応じてカード幅とフォントサイズを動的スリミングする高耐久スケーリングエンジンを搭載。
 */
export class OrgChartSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, members = [], annotations = [] } = content;

    if (!members.length) {
      this.ui.renderSlideHeader(slide, title || 'Project Organization');
      this.ui.renderFooterAnnotations(slide, annotations);
      return;
    }

    // --- 1. ヘッダー描画 (他スライドと同一の標準固定レイアウト) ---
    const startY = this.config.layout.headerTotalH; // 1.1 インチ
    this.ui.renderSlideHeader(slide, title || 'Project Organization');

    const baseX = this.config.layout.baseX; // 0.5 インチ
    const safeW = this.config.layout.safeW; // 9.0 インチ
    const totalH = 3.6;                     // 描画可能縦幅

    // 階層別カラーマップ (完全フラット・モダン)
    const levelColors: { [key: number]: { bg: string, border: string, text: string, label: string } } = {
      0: { bg: 'EEF2FF', border: 'C7D2FE', text: '4F46E5', label: '312E81' }, // Top: インディゴ調
      1: { bg: 'EFF6FF', border: 'BFDBFE', text: '2563EB', label: '1E3A8A' }, // Middle: ブルー調
      2: { bg: 'F0FDF4', border: 'BBF7D0', text: '16A34A', label: '14532D' }  // Member: グリーン調
    };
    const defaultCol = { bg: 'FFFFFF', border: 'E2E8F0', text: '475569', label: '1E293B' };

    // --- 2. メンバーの階層ツリー構造の計算 ---
    const memberMap: { [key: string]: any } = {};
    members.forEach((m: any) => {
      memberMap[m.id] = { ...m, children: [], depth: 0 };
    });

    members.forEach((m: any) => {
      if (m.parent && memberMap[m.parent]) {
        memberMap[m.parent].children.push(m.id);
      }
    });

    const calculateDepth = (id: string, currentDepth: number) => {
      const m = memberMap[id];
      if (!m) return;
      m.depth = currentDepth;
      m.children.forEach((childId: string) => {
        calculateDepth(childId, currentDepth + 1);
      });
    };

    members.forEach((m: any) => {
      if (!m.parent || !memberMap[m.parent]) {
        calculateDepth(m.id, 0);
      }
    });

    // 階層グループ化
    const levels: { [key: number]: any[] } = {};
    Object.values(memberMap).forEach((m: any) => {
      if (!levels[m.depth]) levels[m.depth] = [];
      levels[m.depth].push(m);
    });

    const depths = Object.keys(levels).map(Number).sort((a, b) => a - b);
    const maxDepth = depths.length > 1 ? Math.max(...depths) : 1;

    // 👑 高密度自動スケーリング・セーフティ計算 (横並び限界を防ぐ)
    const maxMembersInLevel = Math.max(...depths.map(d => (levels[d] || []).length), 1);
    // スライド安全幅をベースに、最大横並び数に応じて自動スリム化（高密度時はホワイトスペース確保のため分子を削減）
    const isHighDensity = maxMembersInLevel > 5;
    const cardW = Math.max(0.65, Math.min(1.35, (isHighDensity ? 6.6 : 8.0) / maxMembersInLevel));
    const cardH = Math.max(0.28, Math.min(0.55, cardW * (isHighDensity ? 0.48 : 0.45)));
    
    // フォントサイズも連動して自動縮小
    const fontSizeRole = isHighDensity ? 3.2 : 4.5;
    const fontSizeName = isHighDensity ? 4.8 : 6.5;

    // --- 3. 絶対配置座標の事前マッピング ---
    const nodeCoords: { [key: string]: { cx: number, cy: number, cardW: number, cardH: number, top: number, bottom: number } } = {};

    depths.forEach((depth: number) => {
      const levelMembers = levels[depth] || [];
      const N = levelMembers.length;

      // 縦方向の等間隔Y座標算出 (階層数に応じて綺麗に分散)
      const cy = startY + 0.3 + depth * ((totalH - cardH) / maxDepth);

      levelMembers.forEach((member: any, i: number) => {
        // 横方向の均等配置X座標算出
        const cx = baseX + ((i + 0.5) * (safeW / N));

        nodeCoords[member.id] = {
          cx: cx,
          cy: cy,
          cardW: cardW,
          cardH: cardH,
          top: cy - cardH / 2,
          bottom: cy + cardH / 2
        };
      });
    });

    // =========================================================
    // 🌟 Z-Order レイヤー描画 (最背面から接続線 -> 最前面にカード)
    // =========================================================

    // --- 🌟 Z-Order LAYER 1: 指揮レポート系統の接続線の描画 (最背面) ---
    members.forEach((member: any) => {
      if (!member.parent || !nodeCoords[member.id] || !nodeCoords[member.parent]) return;

      const pCoords = nodeCoords[member.parent];
      const cCoords = nodeCoords[member.id];

      const px = pCoords.cx;
      const py = pCoords.bottom; // 親の下端から
      const cx = cCoords.cx;
      const cy = cCoords.top;    // 子の上端へ

      const midY = (py + cy) / 2; // 中間屈折Y点

      const lineColor = 'CBD5E1'; // 上品な極細ライトグレー
      const lineWidth = 0.75;

      // 1. 親下端から中点まで (垂直)
      slide.addShape(this.pptx.ShapeType.line, {
        x: px,
        y: py,
        w: 0,
        h: midY - py,
        line: { color: lineColor, width: lineWidth }
      });

      // 2. 親Xから子Xまで中点線上を走る (水平)
      slide.addShape(this.pptx.ShapeType.line, {
        x: Math.min(px, cx),
        y: midY,
        w: Math.abs(cx - px),
        h: 0,
        line: { color: lineColor, width: lineWidth }
      });

      // 3. 中点から子上端まで (垂直)
      slide.addShape(this.pptx.ShapeType.line, {
        x: cx,
        y: midY,
        w: 0,
        h: cy - midY,
        line: { color: lineColor, width: lineWidth }
      });
    });

    // --- 🌟 Z-Order LAYER 2: メンバーノードカードの描画 (最前面) ---
    depths.forEach((depth: number) => {
      const levelMembers = levels[depth] || [];
      const col = levelColors[depth] || defaultCol;

      levelMembers.forEach((member: any) => {
        const coords = nodeCoords[member.id];
        if (!coords) return;

        const nx = coords.cx - coords.cardW / 2;
        const ny = coords.cy - coords.cardH / 2;

        // A. 白マスク ＆ フラットカラー背景のカード本体 (rectRadius: 0.03 で非常にシャープ)
        slide.addShape(this.pptx.ShapeType.roundRect, {
          x: nx,
          y: ny,
          w: coords.cardW,
          h: coords.cardH,
          fill: { color: col.bg },
          line: { color: col.border, width: 0.5 },
          rectRadius: 0.03
        });

        // B. カード上部: 役割 (Role) ラベルテキスト
        slide.addText(member.role || 'ROLE', {
          x: nx + 0.01,
          y: ny + (isHighDensity ? 0.03 : 0.05),
          w: coords.cardW - 0.02,
          h: isHighDensity ? 0.10 : 0.12,
          fontSize: fontSizeRole,
          bold: true,
          color: col.text,
          align: 'center',
          valign: 'middle',
          margin: 0
        });

        // C. カード中央: 氏名 (Name) テキスト
        slide.addText(member.name || 'NAME', {
          x: nx + 0.01,
          y: ny + (isHighDensity ? 0.14 : 0.18),
          w: coords.cardW - 0.02,
          h: isHighDensity ? 0.14 : 0.18,
          fontSize: fontSizeName,
          bold: true,
          color: col.label,
          align: 'center',
          valign: 'middle',
          margin: 0
        });
      });
    });

    // --- 4. フッター注釈の描画 ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
