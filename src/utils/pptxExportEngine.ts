import pptxgen from 'pptxgenjs';
import { toPng } from 'html-to-image';

export interface ExportOptions {
  themeName: string;
  fileName?: string;
}

/**
 * PPTX変換を行うコアエンジンクラス
 */
export class PptxExportEngine {
  private pptx: pptxgen;
  private options: ExportOptions;

  constructor(options: ExportOptions) {
    this.options = options;
    
    // テーマの検証（現在は modern-indigo のみ対応）
    if (this.options.themeName !== 'modern-indigo') {
      throw new Error(`対象外テーマエラー: 現在のテーマ「${this.options.themeName}」はエクスポートに対応していません。「modern-indigo」テーマを使用してください。`);
    }

    // PptxGenJSインスタンス初期化
    this.pptx = new pptxgen();
    this.pptx.layout = 'LAYOUT_16x9';

    // マスターレイアウト定義
    this.defineMasterLayouts();
  }

  /**
   * modern-indigo テーマ用のマスターレイアウトを定義する
   */
  private defineMasterLayouts() {
    // 1. 通常コンテンツ用マスター（帯なし、背景色のみ）
    this.pptx.defineSlideMaster({
      title: 'MASTER_MODERN_INDIGO_CONTENT',
      background: { color: 'F8FAFC' } // Tailwind slate-50
    });

    // 2. タイトルスライド用マスター（帯なし、背景は各スライドで描画）
    this.pptx.defineSlideMaster({
      title: 'MASTER_MODERN_INDIGO_TITLE',
      background: { color: '6366F1' } // フォールバック用
    });
  }

  /**
   * エクスポート処理のエントリーポイント
   * @param slides 変換対象のスライドデータ配列
   */
  public async export(slides: any[]) {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const type = slide.layout_type || slide.type;
      
      switch (type) {
        case 'title':
        case 'title_slide':
        case 'TitleSlide':
          await this.renderTitleSlide(slide, i);
          break;
        case 'content':
        case 'content_slide':
        case 'ContentSlide':
        case 'agenda':
        case 'agenda_slide':
        case 'AgendaSlide':
        case 'table':
        case 'table_slide':
        case 'TableSlide':
          // これらは native 描画
          if (type.toLowerCase().includes('content')) await this.renderContentSlide(slide, i);
          else if (type.toLowerCase().includes('agenda')) await this.renderAgendaSlide(slide, i);
          else if (type.toLowerCase().includes('table')) await this.renderTableSlide(slide, i);
          break;
        case 'chart':
        case 'chart_slide':
        case 'ChartSlide':
          await this.renderChartSlide(slide, i);
          break;
        case 'quote':
        case 'quote_slide':
        case 'QuoteSlide':
          await this.renderQuoteSlide(slide, i);
          break;
        case 'section':
        case 'section_slide':
        case 'SectionSlide':
          await this.renderSectionSlide(slide, i);
          break;
        case 'profile':
        case 'profile_slide':
        case 'ProfileSlide':
          await this.renderProfileSlide(slide, i);
          break;
        case 'image_content':
        case 'image_content_slide':
        case 'ImageContentSlide':
          await this.renderImageContentSlide(slide, i);
          break;
        case 'kpi_dashboard':
        case 'kpi_dashboard_slide':
        case 'KpiDashboardSlide':
          await this.renderKpiDashboardSlide(slide, i);
          break;
        case 'stats':
        case 'stats_slide':
        case 'StatsSlide':
          await this.renderStatsSlide(slide, i);
          break;
        case 'process_flow':
        case 'process_flow_slide':
        case 'ProcessFlowSlide':
          await this.renderProcessFlowSlide(slide, i);
          break;
        case 'timeline':
        case 'timeline_slide':
        case 'TimelineSlide':
          await this.renderTimelineSlide(slide, i);
          break;
        case 'split':
        case 'split_slide':
        case 'SplitSlide':
          this.renderSplitSlide(slide);
          break;
        default:
          console.warn(`未対応のスライドタイプ: ${type} は仮の代替スライドとして出力されます。`);
          const fallbackSlide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
          fallbackSlide.addText(`[未対応スライド: ${type}]`, { 
            x: '10%', y: '40%', w: '80%', h: 1, 
            color: 'FF0000', fontSize: 24, align: 'center' 
          });
          break;
      }
    }

    const fileName = this.options.fileName || 'Presentation.pptx';
    await this.pptx.writeFile({ fileName });
  }

  // --- ヘルパーメソッド ---

  /**
   * 指定したDOM要素（またはその中の特定の子要素）を高解像度で画像化する
   * @param elementId 対象のDOM要素のID
   * @param subSelector 子要素を指定するセレクタ（任意）
   * @returns Base64エンコードされたPNG画像データ、失敗時はnull
   */
  private async captureElementAsImage(elementId: string, subSelector?: string): Promise<string | null> {
    const parent = document.getElementById(elementId);
    if (!parent) {
      console.warn(`画像化対象の親要素が見つかりません: ${elementId}`);
      return null;
    }

    const element = subSelector ? (parent.querySelector(subSelector) as HTMLElement) : parent;
    if (!element) {
      console.warn(`画像化対象の要素が見つかりません: ${subSelector || elementId}`);
      return null;
    }

    try {
      // Retina対応として pixelRatio: 3 を指定し高解像度化（ラベルの視認性向上のため引き上げ）
      const dataUrl = await toPng(element, { pixelRatio: 3, cacheBust: true });
      return dataUrl;
    } catch (error) {
      console.error(`DOM要素の画像化に失敗しました (${subSelector || elementId}):`, error);
      return null;
    }
  }

  /**
   * スナップショットとしてスライド全面に画像を貼り付ける
   */
  private async renderSnapshotSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const elementId = `slide-capture-${index}`;
    
    // DOMから画像をキャプチャ
    const base64Data = await this.captureElementAsImage(elementId);

    if (base64Data) {
      // 取得した画像をスライド全面に配置
      slide.addImage({
        data: base64Data,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%'
      });
    } else {
      // 画像化失敗時のフォールバック
      slide.addText(`[スナップショット取得失敗: ${slideData.layout_type || slideData.type}]`, {
        x: '10%', y: '40%', w: '80%', h: 1,
        color: 'FF0000', fontSize: 24, align: 'center'
      });
    }
  }

  /**
   * Markdown記法とHTMLタグの両方を除去する
   */
  private stripFormatting(text: string): string {
    if (!text) return "";
    return text
      .replace(/\\n|¥n/g, '\n')          // 文字列としての改行を実際の改行に変換
      .replace(/<[^>]*>/g, "")             // HTMLタグを除去
      .replace(/\*\*(.*?)\*\*/g, "$1")    // 太字
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")       // 斜体
      .replace(/_(.*?)_/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")       // 打ち消し線
      .replace(/`(.*?)`/g, "$1")         // インラインコード
      .replace(/[#>]/g, "")              // その他記号 (* は箇条書き判定用に残す)
      .trim();
  }

  // --- 各スライドのレンダリングメソッド ---

  private async renderTitleSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_TITLE' });
    const elementId = `slide-capture-${index}`;
    
    // A. 背景レイヤーのキャプチャと貼り付け
    const bgData = await this.captureElementAsImage(elementId, '.indigo-bg-layer');
    if (bgData) {
      slide.addImage({ data: bgData, x: 0, y: 0, w: '100%', h: '100%' });
    } else {
      // フォールバック: ネイティブグラデーション
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { type: 'gradient', color: ['6366F1', '8B5CF6'], angle: 135 } as any
      });
    }

    const content = slideData.content || {};
    const xPos = 1.0; // 基準となる左端ライン (1インチ)

    // 1. Logo Text (左端ラインに枠の左側を合わせる)
    if (content.logo_text) {
      const logoText = this.stripFormatting(content.logo_text).toUpperCase();
      const logoW = (logoText.length * 0.08) + 0.2;
      slide.addText(logoText, {
        x: xPos, y: 1.4, w: logoW, h: 0.25,
        color: 'FFFFFF',
        fontSize: 10,
        bold: true,
        align: 'center',
        valign: 'middle',
        line: { color: 'FFFFFF', width: 1.0 },
        margin: 0 // 内側余白を排除
      });
    }

    // 2. Eyebrow
    if (content.eyebrow) {
      slide.addText(this.stripFormatting(content.eyebrow).toUpperCase(), {
        x: xPos, y: 1.9, w: 8.0, h: 0.25,
        color: 'E0E7FF',
        fontSize: 12,
        bold: true,
        align: 'left',
        charSpacing: 1.2,
        margin: 0 // 左端ラインに文字を密着させる
      });
    }

    // 3. Title
    slide.addText(this.stripFormatting(content.title || 'タイトル未設定'), {
      x: xPos, y: 2.15, w: 8.0, h: 0.8,
      color: 'FFFFFF',
      fontSize: 38,
      bold: true,
      align: 'left',
      lineSpacing: 42,
      breakLine: true,
      margin: 0 // 左端ラインに文字を密着させる
    });

    // 4. Subtitle
    if (content.subtitle) {
      slide.addText(this.stripFormatting(content.subtitle), {
        x: xPos, y: 3.1, w: 7.0, h: 0.5,
        color: 'E0E7FF',
        fontSize: 16,
        align: 'left',
        lineSpacing: 24,
        breakLine: true,
        margin: 0 // 左端ラインに文字を密着させる
      });
    }

    // 5. Tags
    if (content.tags && Array.isArray(content.tags) && content.tags.length > 0) {
      let currentX = xPos;
      const tagY = 3.8;
      
      content.tags.forEach((tag: string) => {
        const tagText = this.stripFormatting(tag);
        const tagW = (tagText.length * 0.08) + 0.2;
        
        slide.addShape(this.pptx.ShapeType.roundRect, {
          x: currentX, y: tagY, w: tagW, h: 0.25,
          fill: { color: 'FFFFFF', transparency: 84 },
          rectRadius: 0.12
        });
        
        slide.addText(tagText, {
          x: currentX, y: tagY, w: tagW, h: 0.25,
          fontSize: 9,
          color: 'FFFFFF',
          align: 'center',
          bold: true,
          valign: 'middle',
          margin: 0 // バッジ内でも中央寄せを維持
        });
        
        currentX += tagW + 0.1;
      });
    }

    // 6. Author / Organization
    const authorText = [content.author, content.organization].filter(Boolean).join(' | ');
    if (authorText) {
      slide.addText(this.stripFormatting(authorText), {
        x: 1.0, y: 4.8, w: 8.0, h: 0.4,
        color: 'E0E7FF',
        fontSize: 12,
        align: 'right',
        lineSpacing: 18,
        valign: 'middle'
      });
    }
  }

  private async renderContentSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};

    // 1. Header (Title)
    slide.addText(this.stripFormatting(content.title || 'タイトル'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      color: '0F172A',
      fontSize: 26,
      bold: true,
      margin: 0
    });
    
    // Header Border
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03,
      fill: { color: '6366F1' }
    });

    let currentY = 1.3;

    // 2. Key Message
    if (content.key_message) {
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 0.5, y: currentY, w: 9.0, h: 0.8,
        fill: { color: 'EEF2FF' },
        rectRadius: 0.05
      });
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 0.5, y: currentY, w: 0.05, h: 0.8,
        fill: { color: '6366F1' }
      });
      slide.addText(this.stripFormatting(content.key_message), {
        x: 0.7, y: currentY, w: 8.6, h: 0.8,
        color: '4F46E5',
        fontSize: 18,
        bold: true,
        valign: 'middle',
        margin: 0
      });
      currentY += 1.1;
    }

    // 3. Body Text (Markdown lists -> PPTX bullets)
    if (content.body_text) {
      const processedText = content.body_text.replace(/\\n|¥n/g, '\n');
      const lines = processedText.split('\n').filter((l: string) => l.trim().length > 0);
      
      const bulletItems = lines.map((line: string) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
        const isNum = /^\d+\./.test(trimmed);
        
        let text = this.stripFormatting(line).trim();
        
        // Remove markdown list markers from the text as PPTX will add its own bullets
        if (isBullet) text = text.replace(/^[-*]\s*/, '');
        if (isNum) text = text.replace(/^\d+\.\s*/, '');
        
        return { 
          text: text, 
          options: { 
            bullet: isNum ? { type: 'number' } : (isBullet ? { code: '2022' } : false), 
            breakLine: true 
          } 
        };
      });

      slide.addText(bulletItems, {
        x: 0.5, y: currentY, w: 9.0, h: 3.5,
        color: '334155',
        fontSize: 16,
        valign: 'top',
        lineSpacing: 24,
        margin: 0
      });
    }

    // 4. Annotations
    if (content.annotations && content.annotations.length > 0) {
      const noteText = content.annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        color: '94A3B8',
        fontSize: 10,
        valign: 'bottom',
        margin: 0
      });
    }
  }

  private async renderAgendaSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const { title, lead_text, items: rawItems = [], annotations = [] } = slideData.content || {};
    const items = Array.isArray(rawItems) ? rawItems.slice(0, 10) : [];
    const isMultiColumn = items.length > 4;

    // Header
    slide.addText(this.stripFormatting(title || 'Strategic Agenda'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      fontSize: 28, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' }
    });

    // Lead Text
    let currentY = 1.2;
    if (lead_text) {
      slide.addText(this.stripFormatting(lead_text), {
        x: 0.5, y: currentY, w: 9.0, h: 0.4,
        fontSize: 16, color: '334155', margin: 0
      });
      currentY += 0.6;
    } else {
      currentY += 0.2;
    }

    // Items
    const rowHeight = 0.8;
    items.forEach((item, idx) => {
      const col = isMultiColumn ? (idx % 2) : 0;
      const row = isMultiColumn ? Math.floor(idx / 2) : idx;
      const xBase = col === 0 ? 0.5 : 5.2;
      const yBase = currentY + (row * rowHeight);

      // Icon
      slide.addShape(this.pptx.ShapeType.ellipse, {
        x: xBase, y: yBase + 0.05, w: 0.32, h: 0.32, fill: { color: '6366F1' }
      });
      slide.addText((idx + 1).toString(), {
        x: xBase, y: yBase + 0.05, w: 0.32, h: 0.32,
        fontSize: 12, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle'
      });

      // Text
      slide.addText(this.stripFormatting(item.label), {
        x: xBase + 0.45, y: yBase, w: 4.0, h: 0.3,
        fontSize: 16, bold: true, color: '0F172A', margin: 0
      });
      if (item.description) {
        slide.addText(this.stripFormatting(item.description), {
          x: xBase + 0.45, y: yBase + 0.3, w: 4.0, h: 0.2,
          fontSize: 11, color: '64748B', margin: 0
        });
      }

      // Border
      slide.addShape(this.pptx.ShapeType.rect, {
        x: xBase, y: yBase + rowHeight - 0.1, w: 4.3, h: 0.01, fill: { color: 'E2E8F0' }
      });
    });

    // Annotations
    if (annotations && annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderTableSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { title, description, annotations = [], layout_variation = 'default' } = content;

    const isTwoColumn = layout_variation === 'two-column';

    // 1. Header (Title + Border)
    slide.addText(this.stripFormatting(title || 'データ一覧'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      fontSize: 26, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' }
    });

    // 2. Table Data Preparation
    const tableData: any[][] = [];
    const headers = content.headers || [];
    if (headers.length > 0) {
      tableData.push(headers.map((h: string) => ({
        text: this.stripFormatting(h),
        options: { fill: '6366F1', color: 'FFFFFF', bold: true, fontSize: 12, valign: 'middle', margin: 0.1 }
      })));
    }
    const rows = content.rows || [];
    rows.forEach((row: string[], idx: number) => {
      tableData.push(row.map((cell: string) => ({
        text: this.stripFormatting(cell),
        options: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC', color: '1E293B', fontSize: 11, valign: 'middle', margin: 0.1 }
      })));
    });

    // 3. Description Parsing
    const parseDescToItems = (text: string) => {
      if (!text) return [];
      return text.split('\n').filter(l => l.trim()).map(line => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('-');
        const cleanText = isBullet ? trimmed.replace(/^-\s*/, '') : trimmed;
        return { 
          text: this.stripFormatting(cleanText), 
          options: { bullet: isBullet, fontSize: 11, color: '334155', lineSpacing: 20 }
        };
      });
    };

    // 4. Layout Rendering
    if (isTwoColumn) {
      // 左右分割
      // Description (Left - Vertically Centered)
      if (description) {
        const descItems = parseDescToItems(description);
        slide.addText(descItems, {
          x: 0.5, y: 1.5, w: 3.5, h: 3.5, valign: 'middle', margin: 0
        });
      }
      // Table (Right)
      if (tableData.length > 0) {
        slide.addTable(tableData, {
          x: 4.3, y: 1.5, w: 5.2,
          border: { type: 'solid', color: 'E2E8F0', pt: 1 }
        });
      }
    } else {
      // 上下分割 (Default)
      // Table (Top)
      if (tableData.length > 0) {
        slide.addTable(tableData, {
          x: 0.5, y: 1.3, w: 9.0,
          border: { type: 'solid', color: 'E2E8F0', pt: 1 }
        });
      }

      // Description Box (Bottom)
      if (description) {
        const descItems = parseDescToItems(description);
        const estimatedH = Math.max(0.6, (descItems.length * 0.25) + 0.2);
        const boxY = 5.0 - estimatedH;

        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y: boxY, w: 9.0, h: estimatedH,
          fill: { color: 'F1F5F9' },
          line: { color: 'E2E8F0', width: 1 }
        });
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y: boxY, w: 0.05, h: estimatedH, fill: { color: '6366F1' }
        });

        slide.addText(descItems, {
          x: 0.7, y: boxY, w: 8.6, h: estimatedH, valign: 'middle', margin: 0
        });
      }
    }

    // 5. Annotations
    if (content.annotations && content.annotations.length > 0) {
      const noteText = content.annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderSectionSlide(slideData: any, index: number) {
    // セクションスライドはダーク背景のためマスターを使用せず個別に設定
    const slide = this.pptx.addSlide();
    slide.background = { color: '0F172A' }; // Dark Slate/Indigo
    const content = slideData.content || {};
    const { title, subtitle, section_number, annotations = [] } = content;

    // Center content
    let y = 1.8;
    if (section_number) {
      slide.addText(`SECTION ${section_number}`, {
        x: 0.5, y: y, w: 9.0, h: 0.3,
        fontSize: 18, color: '6366F1', bold: true, align: 'center', margin: 0
      });
      y += 0.5;
    }

    // Separator line
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 4.5, y: y, w: 1.0, h: 0.05, fill: { color: '6366F1' }
    });
    y += 0.4;

    // Title
    slide.addText(this.stripFormatting(title || 'セクションタイトル'), {
      x: 1.0, y: y, w: 8.0, h: 1.0,
      fontSize: 42, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
    });
    y += 1.0;

    // Subtitle
    if (subtitle) {
      slide.addText(this.stripFormatting(subtitle), {
        x: 1.5, y: y, w: 7.0, h: 0.6,
        fontSize: 18, color: 'CBD5E1', align: 'center', valign: 'top'
      });
    }

    // Annotations (White/Muted)
    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '64748B', align: 'left', margin: 0
      });
    }
  }

  private async renderQuoteSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { quote, author, role, annotations = [] } = content;

    // 巨大な引用符 (背景) - 透過指定ができないため非常に薄い色で代用
    slide.addText('“', {
      x: 1.0, y: 0.5, w: 2.0, h: 1.5,
      fontSize: 120, color: 'EEF2FF', align: 'left'
    });

    // メッセージ本体
    slide.addText(this.stripFormatting(quote || 'メッセージを入力してください'), {
      x: 1.5, y: 1.8, w: 7.0, h: 2.0,
      fontSize: 28, bold: true, color: '0F172A', align: 'center', valign: 'middle',
      italic: true
    });

    // 著者情報
    if (author || role) {
      // Separator
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 4.0, y: 4.0, w: 2.0, h: 0.01, fill: { color: 'E2E8F0' }
      });

      let authorY = 4.2;
      if (author) {
        slide.addText(this.stripFormatting(author), {
          x: 2.0, y: authorY, w: 6.0, h: 0.4,
          fontSize: 18, bold: true, color: '6366F1', align: 'center'
        });
        authorY += 0.4;
      }
      if (role) {
        slide.addText(this.stripFormatting(role), {
          x: 2.0, y: authorY, w: 6.0, h: 0.3,
          fontSize: 14, color: '64748B', align: 'center'
        });
      }
    }

    // Annotations
    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderProfileSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { name, role, bio, image_url, annotations = [] } = content;

    // 1. Profile Image (Hybrid)
    const elementId = `slide-capture-${index}`;
    const imageBase64 = await this.captureElementAsImage(elementId, 'img, .profile-image-placeholder');

    const imgW = 3.2;
    const imgH = 3.2;
    const contentYStart = 1.5;
    const contentH = 3.5;
    const imgX = (4.5 - imgW) / 2 + 0.3; // 左カラムの中央付近

    if (imageBase64) {
      slide.addImage({ 
        data: imageBase64, 
        x: imgX, y: contentYStart + (contentH - imgH) / 2, w: imgW, h: imgH
      });
    }

    // 2. Profile Info (Native - 各要素を分離)
    const infoX = 4.8;
    let currentY = contentYStart + 0.2;

    // 名前
    slide.addText(this.stripFormatting(name || 'お名前'), {
      x: infoX, y: currentY, w: 4.5, h: 0.6,
      fontSize: 32, bold: true, color: '0F172A', margin: 0
    });
    currentY += 0.6;

    // 役職
    slide.addText(this.stripFormatting(role || '役職 / 肩書き'), {
      x: infoX, y: currentY, w: 4.5, h: 0.4,
      fontSize: 18, bold: true, color: '6366F1', margin: 0
    });
    currentY += 0.6;

    // 経歴 / 詳細
    if (bio) {
      slide.addText(this.stripFormatting(bio), {
        x: infoX, y: currentY, w: 4.5, h: 2.0,
        fontSize: 14, color: '334155', lineSpacing: 22, valign: 'top', margin: 0
      });
    }

    // Annotations
    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderImageContentSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { 
      title, key_message, body_text, image_url, image_caption,
      layout_variation = 'image-left', annotations = [] 
    } = content;

    const isImageRight = layout_variation === 'image-right';

    // 1. Header
    slide.addText(this.stripFormatting(title || '画像とコンテンツ'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      fontSize: 26, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' }
    });

    // 2. Image Capture (Pinpoint)
    const elementId = `slide-capture-${index}`;
    const imageBase64 = await this.captureElementAsImage(elementId, 'img, .image-placeholder');

    // 3. Layout Rendering
    let imgX = isImageRight ? 5.2 : 0.5;
    let textX = isImageRight ? 0.5 : 5.0;

    // Image
    if (imageBase64) {
      slide.addImage({ 
        data: imageBase64, 
        x: imgX, y: 1.5, w: 4.3, h: 3.2
      });
      if (image_caption) {
        slide.addText(this.stripFormatting(image_caption), {
          x: imgX, y: 4.8, w: 4.3, h: 0.3,
          fontSize: 10, color: '94A3B8', align: 'center'
        });
      }
    }

    // Text (Vertical Centering)
    const allTextItems: any[] = [];
    if (key_message) {
      allTextItems.push({
        text: this.stripFormatting(key_message),
        options: { fontSize: 18, bold: true, color: '6366F1', lineSpacing: 24 }
      });
      allTextItems.push({ text: '\n\n', options: { fontSize: 10 } });
    }
    if (body_text) {
      // 箇条書きパースロジックの再利用
      const parseBodyToBullets = (text: string) => {
        if (!text) return [];
        return text.split('\n').filter(l => l.trim()).map(line => {
          const trimmed = line.trim();
          const isBullet = trimmed.startsWith('-');
          const cleanText = isBullet ? trimmed.replace(/^-\s*/, '') : trimmed;
          return { 
            text: this.stripFormatting(cleanText), 
            options: { bullet: isBullet, fontSize: 14, color: '334155', lineSpacing: 22 }
          };
        });
      };
      allTextItems.push(...parseBodyToBullets(body_text));
    }

    if (allTextItems.length > 0) {
      slide.addText(allTextItems, {
        x: textX, y: 1.5, w: 4.5, h: 3.5,
        valign: 'middle', margin: 0
      });
    }

    // Annotations
    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private renderSplitSlide(slideData: any) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    
    const { 
      title, 
      left_title, left_label, left_text, left_body, left_bullets,
      right_title, right_label, right_text, right_body, right_bullets,
      comparison_icon = 'VS',
      annotations = []
    } = content;

    const lTitle = left_title || left_label || '現状';
    const lBody = left_text || left_body || '';
    const lBullets = Array.isArray(left_bullets) ? left_bullets : [];
    
    const rTitle = right_title || right_label || '理想';
    const rBody = right_text || right_body || '';
    const rBullets = Array.isArray(right_bullets) ? right_bullets : [];

    // 1. Header Title
    slide.addText(this.stripFormatting(title || '比較・分析'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      fontSize: 26, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' }
    });

    // 2. Column Titles
    slide.addText(this.stripFormatting(lTitle), {
      x: 0.5, y: 1.3, w: 4.2, h: 0.4,
      fontSize: 18, bold: true, color: '64748B', align: 'center', margin: 0
    });
    slide.addText(this.stripFormatting(rTitle), {
      x: 5.3, y: 1.3, w: 4.2, h: 0.4,
      fontSize: 18, bold: true, color: '6366F1', align: 'center', margin: 0
    });

    // 3. Panels (Cards)
    // Left Panel
    slide.addShape(this.pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.8, w: 4.2, h: 3.0,
      line: { color: 'E2E8F0', width: 1 },
      fill: { color: 'FFFFFF' },
      rectRadius: 0.05
    });
    // Right Panel (Highlighted)
    slide.addShape(this.pptx.ShapeType.roundRect, {
      x: 5.3, y: 1.8, w: 4.2, h: 3.0,
      line: { color: '6366F1', width: 1.5 },
      fill: { color: 'F8FAFF' }, // 非常に薄いインディゴ
      rectRadius: 0.05
    });
    // Right Panel Top Border (Indigo Accent)
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 5.3, y: 1.8, w: 4.2, h: 0.08,
      fill: { color: '6366F1' }
    });

    // 4. Content Text
    const renderContent = (text: string, bullets: string[], x: number, y: number, w: number) => {
      const allItems: any[] = [];
      if (text) {
        const textLines = text.split('\n').filter(l => l.trim());
        textLines.forEach(line => {
          const trimmed = line.trim();
          const isBullet = trimmed.startsWith('-');
          // 箇条書きの場合は先頭のハイフン記号を除去
          const cleanText = isBullet ? trimmed.replace(/^-\s*/, '') : trimmed;
          allItems.push({ 
            text: this.stripFormatting(cleanText), 
            options: { bullet: isBullet, fontSize: 13, color: '334155', lineSpacing: 20 }
          });
        });
      }
      bullets.forEach(b => {
        allItems.push({ 
          text: this.stripFormatting(b), 
          options: { bullet: true, fontSize: 13, color: '334155', lineSpacing: 20 }
        });
      });

      if (allItems.length > 0) {
        slide.addText(allItems, { x: x + 0.2, y: y + 0.2, w: w - 0.4, h: 2.6, valign: 'top' });
      }
    };

    renderContent(lBody, lBullets, 0.5, 1.8, 4.2);
    renderContent(rBody, rBullets, 5.3, 1.8, 4.2);

    // 5. Center Divider
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 4.99, y: 2.0, w: 0.01, h: 2.5,
      fill: { color: 'E2E8F0' }
    });
    // 文字数に応じてアイコンの幅を動的に調整
    const iconW = Math.max(0.5, (comparison_icon.length * 0.12) + 0.2);
    const iconH = 0.3;
    slide.addShape(this.pptx.ShapeType.roundRect, {
      x: 5.0 - (iconW / 2), y: 3.15 - (iconH / 2), w: iconW, h: iconH,
      fill: { color: '6366F1' },
      rectRadius: 0.5
    });
    slide.addText(this.stripFormatting(comparison_icon), {
      x: 5.0 - (iconW / 2), y: 3.15 - (iconH / 2), w: iconW, h: iconH,
      fontSize: 10, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle',
      wrap: false
    });

    // 6. Annotations
    if (annotations && annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderChartSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { 
      title, key_message, body_text, annotations = [],
      layout_variation = 'bottom-desc' 
    } = content;

    const isTwoColumn = layout_variation === 'two-column';

    // 1. Header
    slide.addText(this.stripFormatting(title || 'データ分析'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      fontSize: 26, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' }
    });

    // 2. Chart Image Capture (ピンポイント)
    const elementId = `slide-capture-${index}`;
    // Rechartsのコンテナを狙い撃ち
    const chartBase64 = await this.captureElementAsImage(elementId, '.recharts-responsive-container');

    // 3. Layout Rendering
    const parseContentToItems = (text: string) => {
      if (!text) return [];
      return text.split('\n').filter(l => l.trim()).map(line => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('-');
        const cleanText = isBullet ? trimmed.replace(/^-\s*/, '') : trimmed;
        return { 
          text: this.stripFormatting(cleanText), 
          options: { bullet: isBullet, fontSize: 13, color: '334155', lineSpacing: 22 }
        };
      });
    };

    if (isTwoColumn) {
      // 左右分割 (手動計算による垂直中央配置)
      const kmText = this.stripFormatting(key_message || '');
      // 高さを推定 (フォントサイズ18, 幅3.8インチ, 1インチあたり約30-35文字)
      const kmLines = Math.ceil(kmText.length / 18) || 1;
      const kmH = kmLines * 0.4; 
      
      const bodyItems = parseContentToItems(body_text || '');
      const bodyLines = bodyItems.length;
      const bodyH = bodyLines * 0.3;
      
      const gap = body_text ? 0.3 : 0;
      const totalH = kmH + gap + bodyH;
      
      // 中央配置の開始位置 (y: 1.5 〜 5.0 の中央)
      const startY = 3.25 - (totalH / 2);

      // Key Message Group
      if (key_message) {
        // アクセント縦棒 (キーメッセージの高さに合わせる)
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y: startY, w: 0.05, h: kmH, fill: { color: '6366F1' }
        });
        slide.addText(kmText, {
          x: 0.7, y: startY, w: 3.8, h: kmH,
          fontSize: 18, bold: true, color: '6366F1', margin: 0, valign: 'middle'
        });
      }

      // Body Text
      if (body_text && bodyItems.length > 0) {
        slide.addText(bodyItems, {
          x: 0.5, y: startY + kmH + gap, w: 4.0, h: bodyH,
          valign: 'top', margin: 0
        });
      }

      // Chart (Right)
      if (chartBase64) {
        slide.addImage({ data: chartBase64, x: 4.8, y: 1.5, w: 4.7, h: 3.5 });
      }
    } else {
      // 上下分割 (Default)
      // Chart (Top)
      if (chartBase64) {
        slide.addImage({ data: chartBase64, x: 1.0, y: 1.2, w: 8.0, h: 2.8 });
      }

      // Text Box (Bottom)
      if (key_message || body_text) {
        const boxY = 4.3;
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y: boxY, w: 9.0, h: 1.3,
          fill: { color: 'F1F5F9' }, // slate-100
          line: { color: 'E2E8F0', width: 1 }
        });
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y: boxY, w: 0.05, h: 1.3, fill: { color: '6366F1' }
        });

        const boxItems: any[] = [];
        if (key_message) {
          boxItems.push({
            text: this.stripFormatting(key_message),
            options: { fontSize: 16, bold: true, color: '6366F1', lineSpacing: 22 }
          });
          boxItems.push({ text: '\n', options: { fontSize: 8 } });
        }
        if (body_text) {
          boxItems.push(...parseContentToItems(body_text).map(it => ({ 
            ...it, options: { ...it.options, fontSize: 11, color: '475569' } 
          })));
        }

        slide.addText(boxItems, {
          x: 0.7, y: boxY + 0.1, w: 8.6, h: 1.1,
          valign: 'middle', margin: 0
        });
      }
    }

    // 4. Annotations
    if (annotations && annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 10, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderKpiDashboardSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { title, summary_kpis = [], detail_kpis = [], body_text, annotations = [] } = content;
    const elementId = `slide-capture-${index}`;

    // 1. Header (Compact)
    slide.addText(this.stripFormatting(title || 'KPI ダッシュボード'), {
      x: 0.5, y: 0.3, w: 9.0, h: 0.5,
      fontSize: 24, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 0.8, w: 9.0, h: 0.02, fill: { color: '6366F1' }
    });

    // 2. Summary KPIs (Top Row - More Compact)
    let currentY = 0.95;
    const cardH_S = 1.1;
    if (summary_kpis.length > 0) {
      const cardW = (9.0 - (summary_kpis.length - 1) * 0.25) / summary_kpis.length;
      for (let i = 0; i < summary_kpis.length; i++) {
        const kpi = summary_kpis[i];
        const x = 0.5 + i * (cardW + 0.25);
        
        slide.addShape(this.pptx.ShapeType.rect, {
          x: x, y: currentY, w: cardW, h: cardH_S,
          fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 }
        });
        slide.addShape(this.pptx.ShapeType.rect, {
          x: x, y: currentY, w: 0.04, h: cardH_S, fill: { color: '6366F1' }
        });
        
        slide.addText(this.stripFormatting(kpi.label), {
          x: x + 0.15, y: currentY + 0.05, w: cardW - 0.3, h: 0.3,
          fontSize: 10, bold: true, color: '64748B'
        });
        slide.addText(`${kpi.value}${kpi.unit || ''}`, {
          x: x + 0.15, y: currentY + 0.3, w: cardW - 0.3, h: 0.5,
          fontSize: 28, bold: true, color: '0F172A', valign: 'middle'
        });

        // Trend Badge (Native Pill Shape)
        if (kpi.change) {
          const trend = kpi.trend || kpi.trend_type;
          const isUp = trend === 'up';
          const isDown = trend === 'down';
          const tColor = isUp ? '10B981' : isDown ? 'F59E0B' : '94A3B8';
          const bColor = isUp ? 'E8F8F2' : isDown ? 'FDF5E7' : 'F4F6F8';
          const arrow = isUp ? '▲' : isDown ? '▼' : '→';
          
          slide.addText(`${arrow} ${kpi.change}`, {
            shape: this.pptx.ShapeType.roundRect,
            x: x + 0.15, y: currentY + 0.75, w: 0.9, h: 0.25,
            fill: { color: bColor }, color: tColor,
            fontSize: 10, bold: true, align: 'center', valign: 'middle',
            rectRadius: 0.5, margin: 0
          });
        }
      }
      currentY += cardH_S + 0.2;
    }

    // 3. Detail KPIs (Grid - Compact)
    if (detail_kpis.length > 0) {
      const cols = detail_kpis.length > 3 ? 3 : detail_kpis.length;
      const detailW = (9.0 - (cols - 1) * 0.2) / cols;
      const cardH_D = 0.65;
      
      for (let i = 0; i < detail_kpis.length; i++) {
        const kpi = detail_kpis[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 0.5 + col * (detailW + 0.2);
        const y = currentY + row * (cardH_D + 0.15);

        slide.addShape(this.pptx.ShapeType.rect, {
          x: x, y: y, w: detailW, h: cardH_D,
          fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 }
        });
        
        slide.addText(this.stripFormatting(kpi.label), {
          x: x + 0.1, y: y + 0.05, w: detailW - 0.2, h: 0.2,
          fontSize: 9, color: '64748B', bold: true
        });
        slide.addText(`${kpi.value}${kpi.unit || ''}`, {
          x: x + 0.1, y: y + 0.25, w: detailW - 1.0, h: 0.35,
          fontSize: 16, bold: true, color: '0F172A'
        });

        // Trend Badge (Native Pill Shape)
        if (kpi.change) {
          const trend = kpi.trend || kpi.trend_type;
          const isUp = trend === 'up';
          const isDown = trend === 'down';
          const tColor = isUp ? '10B981' : isDown ? 'F59E0B' : '94A3B8';
          const bColor = isUp ? 'E8F8F2' : isDown ? 'FDF5E7' : 'F4F6F8';
          const arrow = isUp ? '▲' : isDown ? '▼' : '→';

          slide.addText(`${arrow} ${kpi.change}`, {
            shape: this.pptx.ShapeType.roundRect,
            x: x + detailW - 0.95, y: y + 0.3, w: 0.8, h: 0.22,
            fill: { color: bColor }, color: tColor,
            fontSize: 9, bold: true, align: 'center', valign: 'middle',
            rectRadius: 0.5, margin: 0
          });
        }
      }
    }

    // 4. Insights (Frame Style - 左詰め & 角丸強化)
    if (body_text) {
      const boxH = 0.6;
      const boxY = 4.4; 

      slide.addShape(this.pptx.ShapeType.roundRect, {
        x: 0.5, y: boxY, w: 9.0, h: boxH,
        fill: { color: 'FFFFFF' }, line: { color: '6366F1', width: 1 },
        rectRadius: 0.1
      });
      slide.addText(this.stripFormatting(body_text), {
        x: 0.7, y: boxY, w: 8.6, h: boxH,
        fontSize: 12, color: '334155', valign: 'middle', align: 'left', margin: 10
      });
    }

    // Annotations (Footer)
    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, {
        x: 0.5, y: 5.1, w: 9.0, h: 0.3,
        fontSize: 9, color: '94A3B8', align: 'left', margin: 0
      });
    }
  }

  private async renderStatsSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { title, stats = [], description, body_text, layout_variation = 'default', annotations = [] } = content;
    const mainText = body_text || description;

    slide.addText(this.stripFormatting(title || '主要実績'), {
      x: 0.5, y: 0.4, w: 9.0, h: 0.6,
      fontSize: 26, bold: true, color: '0F172A', margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' }
    });

    const activeStats = Array.isArray(stats) ? stats : [];
    if (layout_variation === 'two-column') {
      if (mainText) {
        slide.addShape(this.pptx.ShapeType.rect, {
          x: 0.5, y: 1.5, w: 3.5, h: 3.0,
          fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 }
        });
        slide.addText(this.stripFormatting(mainText), {
          x: 0.7, y: 1.5, w: 3.1, h: 3.0,
          fontSize: 16, color: '334155', valign: 'middle'
        });
      }
      activeStats.forEach((stat: any, idx: number) => {
        const x = 4.3 + (idx % 2) * 2.6;
        const y = 1.5 + Math.floor(idx / 2) * 1.6;
        slide.addShape(this.pptx.ShapeType.rect, { x, y, w: 2.5, h: 1.4, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 } });
        slide.addText(`${stat.value}${stat.unit || ''}`, { x, y: y + 0.2, w: 2.5, h: 0.6, fontSize: 28, bold: true, color: '6366F1', align: 'center' });
        slide.addText(this.stripFormatting(stat.label), { x, y: y + 0.8, w: 2.5, h: 0.3, fontSize: 12, bold: true, color: '0F172A', align: 'center' });
      });
    } else {
      const cols = activeStats.length <= 2 ? activeStats.length : Math.ceil(activeStats.length / 2);
      const cardW = (9.0 - (cols - 1) * 0.4) / cols;
      activeStats.forEach((stat: any, idx: number) => {
        const x = 0.5 + (idx % cols) * (cardW + 0.4);
        const y = 1.5 + Math.floor(idx / cols) * 2.0;
        slide.addShape(this.pptx.ShapeType.rect, { x, y, w: cardW, h: 1.8, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 } });
        // Decorative circle in background
        slide.addShape(this.pptx.ShapeType.ellipse, {
          x: x + cardW - 1.0, y: y - 0.2, w: 1.2, h: 1.2,
          fill: { color: '6366F1', transparency: 95 }
        });
        slide.addText(`${stat.value}${stat.unit || ''}`, { x, y: y + 0.3, w: cardW, h: 0.8, fontSize: 42, bold: true, color: '6366F1', align: 'center' });
        slide.addText(this.stripFormatting(stat.label), { x, y: y + 1.1, w: cardW, h: 0.4, fontSize: 16, bold: true, color: '0F172A', align: 'center' });
      });
    }

    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, { x: 0.5, y: 5.1, w: 9.0, h: 0.3, fontSize: 10, color: '94A3B8', align: 'left' });
    }
  }

  private async renderProcessFlowSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { title, steps = [], process_steps = [], items = [], key_message, body_text, annotations = [] } = content;
    const rawSteps = process_steps.length > 0 ? process_steps : (steps.length > 0 ? steps : items);
    const activeSteps = Array.isArray(rawSteps) ? rawSteps : [];

    slide.addText(this.stripFormatting(title || 'プロセスフロー'), { x: 0.5, y: 0.4, w: 9.0, h: 0.6, fontSize: 26, bold: true, color: '0F172A' });
    slide.addShape(this.pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' } });

    const cols = activeSteps.length <= 4 ? activeSteps.length : Math.ceil(activeSteps.length / 2);
    const cardW = (9.0 - (cols - 1) * 0.3) / cols;
    activeSteps.forEach((step: any, idx: number) => {
      const x = 0.5 + (idx % cols) * (cardW + 0.3);
      const y = 1.5 + Math.floor(idx / cols) * 1.8;
      slide.addShape(this.pptx.ShapeType.rect, { x, y, w: cardW, h: 1.5, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 } });
      slide.addShape(this.pptx.ShapeType.rect, { x, y, w: 0.05, h: 1.5, fill: { color: '6366F1' } });
      slide.addText(`STEP ${idx + 1}`, { x: x + 0.1, y: y + 0.1, w: cardW - 0.2, h: 0.2, fontSize: 9, bold: true, color: '6366F1' });
      slide.addText(this.stripFormatting(step.title || step.label || step), { x: x + 0.1, y: y + 0.3, w: cardW - 0.2, h: 0.4, fontSize: 14, bold: true });
      if (step.description) slide.addText(this.stripFormatting(step.description), { x: x + 0.1, y: y + 0.7, w: cardW - 0.2, h: 0.7, fontSize: 10, color: '64748B', valign: 'top' });
    });

    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, { x: 0.5, y: 5.1, w: 9.0, h: 0.3, fontSize: 10, color: '94A3B8' });
    }
  }

  private async renderTimelineSlide(slideData: any, index: number) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {};
    const { title, items = [], events = [], layout_variation = 'vertical', annotations = [] } = content;
    const activeEvents = Array.isArray(events.length > 0 ? events : items) ? (events.length > 0 ? events : items) : [];

    slide.addText(this.stripFormatting(title || 'タイムライン'), { x: 0.5, y: 0.4, w: 9.0, h: 0.6, fontSize: 26, bold: true, color: '0F172A' });
    slide.addShape(this.pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 9.0, h: 0.03, fill: { color: '6366F1' } });

    if (layout_variation === 'horizontal') {
      slide.addShape(this.pptx.ShapeType.rect, { x: 0.5, y: 3.0, w: 9.0, h: 0.04, fill: { color: '6366F1' } });
      const stepX = 9.0 / activeEvents.length;
      activeEvents.forEach((event: any, idx: number) => {
        const x = 0.5 + idx * stepX + stepX / 2;
        slide.addShape(this.pptx.ShapeType.ellipse, { x: x - 0.1, y: 2.9, w: 0.2, h: 0.2, fill: { color: '6366F1' }, line: { color: 'FFFFFF', width: 2 } });
        const cardY = idx % 2 === 0 ? 1.5 : 3.3;
        slide.addText(this.stripFormatting(event.label || event.date || ''), { x: x - stepX / 2, y: cardY, w: stepX, h: 0.3, fontSize: 12, bold: true, color: '6366F1', align: 'center' });
        slide.addText(this.stripFormatting(event.title || ''), { x: x - stepX / 2, y: cardY + 0.3, w: stepX, h: 0.4, fontSize: 14, bold: true, align: 'center' });
      });
    } else {
      slide.addShape(this.pptx.ShapeType.rect, { x: 1.0, y: 1.5, w: 0.03, h: 3.5, fill: { color: '6366F1', transparency: 70 } });
      const stepY = 3.5 / Math.max(activeEvents.length, 1);
      activeEvents.forEach((event: any, idx: number) => {
        const y = 1.5 + idx * stepY;
        slide.addShape(this.pptx.ShapeType.ellipse, { x: 0.9, y, w: 0.2, h: 0.2, fill: { color: '6366F1' }, line: { color: 'FFFFFF', width: 2 } });
        slide.addText(this.stripFormatting(event.label || event.date || ''), { x: 1.4, y: y - 0.1, w: 1.5, h: 0.3, fontSize: 12, bold: true, color: '6366F1' });
        slide.addText(this.stripFormatting(event.title || ''), { x: 3.0, y: y - 0.1, w: 6.0, h: 0.3, fontSize: 16, bold: true });
        if (event.description) slide.addText(this.stripFormatting(event.description), { x: 3.0, y: y + 0.2, w: 6.0, h: 0.4, fontSize: 11, color: '64748B' });
      });
    }

    if (annotations.length > 0) {
      const noteText = annotations.map((n: string) => this.stripFormatting(n)).join(' | ');
      slide.addText(noteText, { x: 0.5, y: 5.1, w: 9.0, h: 0.3, fontSize: 10, color: '94A3B8' });
    }
  }
}
