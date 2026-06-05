import pptxgen from 'pptxgenjs';
import mermaid from 'mermaid';
import { inferLayout } from '../../../components/Artifacts/JsonSlide/engine/LayoutEngine.ts';

const svgToPng = (svgString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const encodedSvg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // PPTX出力用の高解像度化
      const width = img.width || 800;
      const height = img.height || 600;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = (e) => reject(new Error('Failed to load SVG into Image'));
    img.src = encodedSvg;
  });
};

/**
 * 動的スライドレイアウト用のPPTXレンダラー
 * blocks配列と推論されたGridを元に、PptxGenJSのキャンバス上にZone（座標）をマッピングします。
 */
export class DynamicSlideRenderer {
  private pptx: pptxgen;
  private config: any;

  constructor(pptx: pptxgen, config: any) {
    this.pptx = pptx;
    this.config = config;
  }

  public async render(slideData: any, index: number) {
    // スライドの追加 (マスターレイアウト使用)
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const primaryColor = (this.config.colors.primary || '00205B').replace('#', '');

    // トップアクセントライン (Theme Decoration)
    if (slideData.blocks && slideData.blocks[0]?.type !== 'title_cover') {
        slide.addShape(this.pptx.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: '2%',
            fill: { color: primaryColor }
        });
    }

    // 1. ヘッダー (Key Message) の描画
    const keyMessage = slideData.key_message || slideData.content?.title || '';
    if (keyMessage && slideData.blocks && slideData.blocks[0]?.type !== 'title_cover') {
        slide.addText(keyMessage, {
            x: '5%', y: '5%', w: '90%', h: '10%',
            fontSize: 20,
            bold: true,
            color: primaryColor,
            valign: 'middle'
        });
        // キーメッセージ下線
        slide.addShape(this.pptx.ShapeType.rect, {
            x: '5%', y: '16%', w: '90%', h: 0.02,
            fill: { color: primaryColor }
        });
    }

    const blocks = slideData.blocks || [];
    if (blocks.length === 0) return;

    // 2. レイアウト（Grid）の推論
    const gridName = inferLayout(blocks);

    // 3. Gridに基づくZone（領域）の割り当て
    await this.renderGridBlocks(slide, gridName, blocks);
  }

  private async renderGridBlocks(slide: pptxgen.Slide, gridName: string, blocks: any[]) {
    // TwoColumnSplitGrid の場合は、UI（LayoutEngine）の実装に合わせて「1つ目を左、2つ目以降を右」に厳密に配置する
    if (gridName === 'TwoColumnSplitGrid') {
      for (let idx = 0; idx < blocks.length; idx++) {
        const block = blocks[idx];
        let currentZone;
        if (idx === 0) {
          // 左列（縦方向中央揃えを美しくするため、全体の高さを確保）
          currentZone = { x: '5%', y: '20%', w: '43%', h: '70%' };
        } else {
          // 右列（複数ブロックある場合は均等に分割）
          const rightBlocksCount = blocks.length - 1;
          const rightIndex = idx - 1;
          const totalRightH = 70;
          const gap = rightBlocksCount > 1 ? 5 : 0;
          const hPerBlock = (totalRightH - (gap * (rightBlocksCount - 1))) / rightBlocksCount;
          const yPos = 20 + (rightIndex * (hPerBlock + gap));
          currentZone = { x: '52%', y: `${yPos}%`, w: '43%', h: `${hPerBlock}%` };
        }
        await this.renderBlock(slide, block, currentZone);
      }
      return;
    }

    let zones = [];
    
    // Grid定義に基づくハードコードされたZone（x, y, w, h）
    if (gridName === 'TitleCoverGrid') {
      zones = [ { x: '10%', y: '25%', w: '80%', h: '50%' } ];
    } else if (gridName === 'ThreeColumnMultiGrid') {
      zones = [ { x: '5%', y: '20%', w: '28%', h: '75%' }, { x: '36%', y: '20%', w: '28%', h: '75%' }, { x: '67%', y: '20%', w: '28%', h: '75%' } ];
    } else if (gridName === 'RowStackGrid') {
      zones = [ { x: '5%', y: '20%', w: '90%', h: '35%' }, { x: '5%', y: '58%', w: '90%', h: '35%' } ];
    } else {
      zones = [ { x: '10%', y: '20%', w: '80%', h: '75%' } ];
    }

    // ブロックを順番にレンダリング
    for (let idx = 0; idx < blocks.length; idx++) {
      const block = blocks[idx];
      const zone = zones[idx % zones.length];
      
      const iteration = Math.floor(idx / zones.length);
      const yOffsetPercent = iteration * 20; 
      
      const currentZone = {
        x: zone.x,
        y: `${parseInt(zone.y) + yOffsetPercent}%`,
        w: zone.w,
        h: zone.h 
      };

      await this.renderBlock(slide, block, currentZone);
    }
  }

  private async renderBlock(slide: pptxgen.Slide, block: any, zone: any) {
    const textColor = (this.config.colors.text?.body || '333333').replace('#', '');
    const primaryColor = (this.config.colors.primary || '00205B').replace('#', '');
    const bgAltColor = 'F8FAFC';

    if (block.type === 'title_cover') {
      slide.addText(block.title, {
        x: '15%', y: '25%', w: '70%', h: '25%',
        fontSize: 40, bold: true, color: primaryColor, align: 'left', valign: 'bottom'
      });
      if (block.subtitle) {
        slide.addText(block.subtitle, {
          x: '15%', y: '50%', w: '70%', h: '10%',
          fontSize: 18, color: textColor, align: 'left', valign: 'top'
        });
      }
      slide.addShape(this.pptx.ShapeType.rect, {
        x: '15%', y: '61%', w: '70%', h: 0.03,
        fill: { color: primaryColor }
      });
      
      const presenterText = [block.presenter, block.organization].filter(Boolean).join('\n');
      slide.addText(presenterText, {
        x: '15%', y: '65%', w: '35%', h: '15%',
        fontSize: 14, color: '64748B', align: 'left', valign: 'top'
      });
      
      if (block.date) {
        slide.addText(block.date, {
          x: '50%', y: '65%', w: '35%', h: '15%',
          fontSize: 14, color: '64748B', align: 'right', valign: 'top'
        });
      }
    } else if (block.type === 'text') {
      slide.addText(block.content, {
        x: zone.x, y: zone.y, w: zone.w, h: zone.h,
        fontSize: 14, color: textColor, align: 'left', valign: 'middle', margin: [0, 10, 0, 10]
      });
    } else if (block.type === 'key_value_card') {
      const cardHeight = '25%';
      slide.addShape(this.pptx.ShapeType.rect, {
        x: zone.x, y: zone.y, w: zone.w, h: cardHeight,
        fill: { color: 'FFFFFF' },
        line: { color: 'CBD5E1', width: 0.5, dashType: 'solid' }
      });
      // 左アクセント線
      slide.addShape(this.pptx.ShapeType.rect, {
        x: zone.x, y: zone.y, w: '2%', h: cardHeight,
        fill: { color: primaryColor }
      });
      slide.addText(block.title, {
        x: `${parseInt(zone.x) + 4}%`, y: zone.y, w: `${parseInt(zone.w) - 6}%`, h: '10%',
        fontSize: 12, color: '64748B', align: 'left', valign: 'bottom'
      });
      slide.addText(String(block.value), {
        x: `${parseInt(zone.x) + 4}%`, y: `${parseInt(zone.y) + 10}%`, w: `${parseInt(zone.w) - 6}%`, h: '15%',
        fontSize: 24, bold: true, color: primaryColor, align: 'left', valign: 'middle'
      });
    } else if (block.type === 'comparison_table') {
      const headers = block.headers || [];
      const rows = block.rows || [];
      const tableData = [
        headers.map((h: string) => ({ 
          text: h, 
          options: { 
            fill: 'F1F5F9', color: primaryColor, bold: true, 
            align: 'center', valign: 'middle',
            border: { type: 'solid', pt: 1, color: primaryColor, loc: 'b' } 
          } 
        })),
        ...rows.map((row: any[]) => row.map(c => ({ 
          text: String(c),
          options: { valign: 'middle' }
        })))
      ];
      if (tableData.length > 0) {
        slide.addTable(tableData, {
          x: zone.x, y: zone.y, w: zone.w,
          border: { type: 'solid', color: 'CBD5E1', pt: 0.5 },
          fontSize: 11,
          color: textColor,
          valign: 'middle',
          margin: [4, 4, 4, 4]
        });
      }
    } else if (block.type === 'content_card') {
      slide.addShape(this.pptx.ShapeType.rect, {
        x: zone.x, y: zone.y, w: zone.w, h: '12%',
        fill: { color: primaryColor }
      });
      slide.addText(block.title, {
        x: zone.x, y: zone.y, w: zone.w, h: '12%',
        fontSize: 12, bold: true, color: 'FFFFFF', align: 'left', valign: 'middle', margin: [0, 10, 0, 10]
      });
      slide.addShape(this.pptx.ShapeType.rect, {
        x: zone.x, y: `${parseInt(zone.y) + 12}%`, w: zone.w, h: `${parseInt(zone.h) - 12}%`,
        fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 0.5 }
      });
      slide.addText(block.description, {
        x: zone.x, y: `${parseInt(zone.y) + 14}%`, w: zone.w, h: '25%',
        fontSize: 12, color: textColor, align: 'left', valign: 'top', margin: [0, 10, 0, 10]
      });
      if (block.points && block.points.length > 0) {
        const bulletText = block.points.map((pt: string) => ({ 
          text: pt, 
          options: { 
            bullet: { code: '25A0', color: primaryColor },
            breakLine: true,
            paraSpaceAfter: 6
          } 
        }));
        slide.addText(bulletText, {
          x: zone.x, y: `${parseInt(zone.y) + 39}%`, w: zone.w, h: '40%',
          fontSize: 11, color: '475569', align: 'left', valign: 'top', margin: [0, 10, 0, 10]
        });
      }
    } else if (block.type === 'list') {
      const items = block.items || [];
      const bulletText = items.map((pt: string) => ({ 
        text: pt, 
        options: { 
          bullet: { code: '25A0', color: primaryColor },
          breakLine: true,
          paraSpaceAfter: 12,
          color: textColor
        } 
      }));
      slide.addText(bulletText, {
        x: zone.x, y: zone.y, w: zone.w, h: zone.h,
        fontSize: 14, align: 'left', valign: 'middle', margin: [0, 10, 0, 10]
      });
    } else if (block.type === 'chart') {
      const chartData = [{
        name: block.title || 'Chart',
        labels: (block.data || []).map((d: any) => d.label),
        values: (block.data || []).map((d: any) => d.value)
      }];

      // PptxGenJSのチャート描画はパーセンテージ指定の文字列('52%')だとバグで全画面幅にフォールバックして左寄せになるため、
      // 16:9スライドの標準インチサイズ（10 x 5.625）をベースに絶対値（インチ）に変換して指定する
      const pctToInches = (val: string | number, max: number) => 
        (typeof val === 'string' && val.endsWith('%')) ? (parseFloat(val) / 100) * max : Number(val);
      
      const cx = pctToInches(zone.x, 10);
      const cy = pctToInches(zone.y, 5.625);
      const cw = pctToInches(zone.w, 10);
      const ch = pctToInches(zone.h, 5.625);

      slide.addChart(this.pptx.ChartType.bar, chartData, {
        x: cx, y: cy, w: cw, h: ch,
        barDir: 'bar',
        chartColors: [primaryColor],
        showTitle: true,
        title: block.title || '',
        titleFontSize: 12,
        titleColor: textColor,
        showValue: true,
        dataLabelPosition: 'outEnd',
        dataLabelFontSize: 11,
        dataLabelColor: primaryColor,
        valAxisHidden: true,
        catAxisLineShow: false,
        catGridLine: { style: 'none' },
        valGridLine: { style: 'none' }
      });
    } else if (block.type === 'mermaid') {
      const id = `mermaid-export-${Math.random().toString(36).substr(2, 9)}`;
      try {
        // PPTXエクスポート時は、PowerPointが解釈できないHTMLラベル（<foreignObject>）の生成を防ぐため、
        // Mermaidの初期化ディレクティブをコードの先頭に動的に注入し、純粋なSVGの<text>として描画させる
        const exportCode = `%%{init: {'flowchart': {'htmlLabels': false}}}%%\n${block.code}`;
        let { svg } = await mermaid.render(id, exportCode);
        
        // さらに、PowerPointがSVG内の<style>タグを無視して文字を透明にしてしまうバグを回避するため、
        // ブラウザのCanvasAPIを使ってSVGを完璧な見た目の「高解像度PNG」に変換してから埋め込む
        const pngDataUrl = await svgToPng(svg);
                 
        slide.addImage({ 
          data: pngDataUrl, 
          x: zone.x, y: zone.y, w: zone.w, h: zone.h,
          sizing: { type: 'contain', w: zone.w, h: zone.h }
        });
      } catch (err) {
        console.warn('PPTX Mermaid render error:', err);
        slide.addShape(this.pptx.ShapeType.rect, {
          x: zone.x, y: zone.y, w: zone.w, h: zone.h,
          fill: { color: 'F1F5F9' }, line: { color: '94A3B8', width: 1, dashType: 'dash' }
        });
        slide.addText(`[Mermaid Diagram Error]`, {
          x: zone.x, y: zone.y, w: zone.w, h: zone.h,
          fontSize: 12, color: '475569', align: 'center', valign: 'middle'
        });
      }
    } else {
       slide.addShape(this.pptx.ShapeType.rect, {
        x: zone.x, y: zone.y, w: zone.w, h: zone.h,
        fill: { color: bgAltColor }
       });
       slide.addText(`[未対応ブロック: ${block.type}]`, {
        x: zone.x, y: zone.y, w: zone.w, h: zone.h,
        fontSize: 14, color: '888888', align: 'center', valign: 'middle'
       });
    }
  }
}
