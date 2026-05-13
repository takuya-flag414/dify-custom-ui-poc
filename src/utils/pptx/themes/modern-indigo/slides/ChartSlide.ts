import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * ChartSlideRenderer - チャート・データ分析スライド (Native Chart版)
 * 
 * デザイン意図: 
 * 左右端まで使い切るエディトリアルなグラフ配置。
 * インディゴテーマの公式パレットを使用し、UIとの一貫性を保持。
 */
export class ChartSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, chart_type = 'bar', data: rawData = [], key_message, body_text, annotations = [], layout_variation = 'bottom-desc' } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Data Analysis');
    currentY += 0.3;

    const isTwoColumn = layout_variation === 'left-desc' || layout_variation === 'two-column';
    const mainH = 3.6;

    // --- 2. データの準備 ---
    const chartData = (Array.isArray(rawData) ? rawData : []).map(item => ({
      name: item.label || item.name || '',
      value: Number(item.value) || 0
    }));

    const labels = chartData.map(d => d.name);
    const values = chartData.map(d => d.value);
    const pptxChartData = [{ name: 'Data', labels, values }];

    // --- 3. グラフオプションの設定 ---
    const type = chart_type.toLowerCase();

    // ベースカラー（primary）から同系統の濃淡パレットを動的に生成
    const dynamicPalette = this.generateMonotonicPalette(this.config.colors.primary);

    const chartColors = (['pie', 'doughnut', 'bar'].includes(type)) 
      ? dynamicPalette 
      : [dynamicPalette[0]];

    const chartOpts: any = {
      x: 0, y: 0, w: 0, h: 0,
      showTitle: false,
      showLegend: type === 'pie' || type === 'doughnut',
      legendPos: 'b',
      chartColors: chartColors,
      varyColors: ['bar', 'pie', 'doughnut'].includes(type),
      
      // 軸・フォント設定 (Slate-500相当)
      valAxisLabelFontSize: 9,
      valAxisLabelColor: '64748B',
      catAxisLabelFontSize: 9,
      catAxisLabelColor: '64748B',
      
      // グリッド線と軸線
      valAxisLineShow: false,
      catAxisLineShow: true,
      catAxisLineColor: 'E2E8F0',
      valGridLine: { color: 'F1F5F9', style: 'dash' },
      
      // 左右の隙間をなくすための設定
      // Line/Areaチャートで端まで線を伸ばす
      catAxisLabelPos: 'low',
      catAxisTickLabelPos: 'nextTo',
      catAxisMajorTickMark: 'none',
      catAxisMinorTickMark: 'none',
      
      // エリアチャート/折れ線グラフの質感
      lineSize: 2,
      lineSmooth: true,
      dataBorder: { color: 'FFFFFF', width: 1 }, // 棒グラフの境界
      
      // エリア塗りつぶしの透過設定 (Areaチャート時)
      chartColorsOpacity: chart_type === 'area' ? 15 : 100,
    };

    // グラフタイプのマッピング
    let pptxChartType = this.pptx.ChartType.bar;
    if (type === 'line') pptxChartType = this.pptx.ChartType.line;
    else if (type === 'area') pptxChartType = this.pptx.ChartType.area;
    else if (type === 'pie') pptxChartType = this.pptx.ChartType.pie;
    else if (type === 'doughnut') pptxChartType = this.pptx.ChartType.doughnut;

    // --- 4. テキスト解析関数 ---
    const processTextToBullets = (text: string, fontSize: number): any[] => {
      if (!text) return [];
      const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter(l => l.trim().length > 0);
      const items: any[] = [];
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
        const cleanLine = isBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed;
        const lineParts = this.textProcessor.parseRichText(cleanLine, { color: '1E293B', fontSize });
        if (lineParts.length > 0) {
          lineParts[0].options = { ...lineParts[0].options, bullet: isBullet ? { code: '2022' } : false, breakLine: true };
          for (let i = 1; i < lineParts.length; i++) lineParts[i].options = { ...lineParts[i].options, breakLine: false };
          items.push(...lineParts);
        }
      });
      return items;
    };

    if (isTwoColumn) {
      // --- 左右分割レイアウト (1:2) ---
      const slideW = 10.0;
      const marginX = 0.6;
      const safeW = slideW - (marginX * 2);
      const centerGap = 0.6;
      const leftW = (safeW - centerGap) * 0.35;
      const rightW = (safeW - centerGap) * 0.65;
      const leftX = marginX;
      const rightX = leftX + leftW + centerGap;

      // 左側: インサイト
      let ly = currentY;
      if (key_message) {
        slide.addShape(this.pptx.ShapeType.rect, { x: leftX, y: ly, w: 0.05, h: 0.3, fill: { color: this.config.colors.primary } });
        const kmParts = this.textProcessor.parseRichText(key_message, { fontSize: 13, bold: true, color: '0F172A' });
        slide.addText(kmParts, { x: leftX + 0.15, y: ly, w: leftW - 0.2, h: 0.3, valign: 'middle', margin: 0 });
        ly += 0.45;
      }
      if (body_text) {
        const bodyItems = processTextToBullets(body_text, 10);
        // キーメッセージがある場合はインデントを入れる
        const textX = key_message ? leftX + 0.15 : leftX;
        slide.addText(bodyItems, { x: textX, y: ly, w: leftW - (textX - leftX), h: mainH - (ly - currentY), valign: 'top', margin: 0, lineSpacing: 10 * 1.6 });
      }

      // 中央ディバイダー
      slide.addShape(this.pptx.ShapeType.rect, { x: leftX + leftW + (centerGap / 2), y: currentY, w: 0.01, h: mainH, fill: { color: 'E2E8F0' } });

      // 右側: グラフ描画
      chartOpts.x = rightX;
      chartOpts.y = currentY;
      chartOpts.w = rightW;
      chartOpts.h = mainH;
      slide.addChart(pptxChartType, pptxChartData, chartOpts);
    } else {
      // --- 上下レイアウト ---
      // コンテンツの有無でグラフの高さを動的に調整 (はみ出し防止)
      let chartH = 2.8;
      if (key_message && body_text) chartH = 2.0;
      else if (key_message || body_text) chartH = 2.4;

      const chartW = this.config.layout.safeW;
      
      chartOpts.x = this.config.layout.baseX;
      chartOpts.y = currentY;
      chartOpts.w = chartW;
      chartOpts.h = chartH;
      slide.addChart(pptxChartType, pptxChartData, chartOpts);

      let insightY = currentY + chartH + 0.2;
      const insightX = this.config.layout.baseX;

      if (key_message) {
        // キーメッセージ (アクセントバー付き)
        slide.addShape(this.pptx.ShapeType.rect, { x: insightX, y: insightY, w: 0.05, h: 0.3, fill: { color: this.config.colors.primary } });
        const kmParts = this.textProcessor.parseRichText(key_message, { fontSize: 13, bold: true, color: '0F172A' });
        slide.addText(kmParts, { x: insightX + 0.15, y: insightY, w: chartW - 0.15, h: 0.3, valign: 'middle' });
        insightY += 0.4;
      }

      if (body_text) {
        // 補足分析テキスト (箇条書き)
        const bodyItems = processTextToBullets(body_text, 10);
        const textX = key_message ? insightX + 0.15 : insightX;
        // はみ出し防止のため、残りの高さを制限 (フッターの開始位置 5.0 を目安にする)
        const maxBodyH = Math.max(0.6, 5.0 - insightY);
        slide.addText(bodyItems, { x: textX, y: insightY, w: chartW - (textX - insightX), h: maxBodyH, valign: 'top', lineSpacing: 10 * 1.5 });
      }
    }

    // --- 4. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }

  /**
   * ベースカラーから同系統の濃淡パレットを生成する
   */
  private generateMonotonicPalette(baseHex: string): string[] {
    // '#' が付いている場合は除去
    const hex = baseHex.startsWith('#') ? baseHex.slice(1) : baseHex;
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const adjust = (val: number, factor: number) => 
      Math.min(255, Math.max(0, Math.round(val * factor)))
        .toString(16).padStart(2, '0').toUpperCase();

    // 複数の係数で濃淡を作成 (濃い -> 標準 -> 薄い)
    return [
      hex,                   // 標準
      `${adjust(r, 0.85)}${adjust(g, 0.85)}${adjust(b, 0.85)}`, // やや濃い
      `${adjust(r, 1.2)}${adjust(g, 1.2)}${adjust(b, 1.2)}`,    // やや薄い
      `${adjust(r, 0.7)}${adjust(g, 0.7)}${adjust(b, 0.7)}`,    // 濃い
      `${adjust(r, 1.4)}${adjust(g, 1.4)}${adjust(b, 1.4)}`,    // 薄い
      `${adjust(r, 0.55)}${adjust(g, 0.55)}${adjust(b, 0.55)}`, // かなり濃い
      `${adjust(r, 1.6)}${adjust(g, 1.6)}${adjust(b, 1.6)}`     // かなり薄い
    ];
  }
}
