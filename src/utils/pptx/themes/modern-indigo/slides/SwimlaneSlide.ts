// src/utils/pptx/themes/modern-indigo/slides/SwimlaneSlide.ts
import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * SwimlaneSlideRenderer - 一般化されたスキーマ主導型スイムレーン PPTX レンダラー
 * 
 * デザイン意図:
 * LLM（Dify等）のメッセージ設計意図（1枚のスライド構造）を100%完全に尊重し、
 * JSONデータスキーマ（phases, lanes[].type, steps[].flow_style / flow_color）に従って
 * パワーポイント資料上でも圧倒的な可読性とプロフェッショナリズムを発揮する高品位な静的インフォグラフィックを再現。
 */
export class SwimlaneSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    // マスタースライド（白背景等の土台）を適用してスライドを追加
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, lanes = [], steps = [], annotations = [], phases = [] } = content;

    // データが無い場合はヘッダーと注釈のみ描画してスキップ
    if (!lanes.length || !steps.length) {
      this.ui.renderSlideHeader(slide, title || 'Process Flow');
      this.ui.renderFooterAnnotations(slide, annotations);
      return;
    }

    // --- 1. ヘッダー描画 (他スライドと完全に同一の固定位置) ---
    const startY = this.config.layout.headerTotalH; // 1.1 インチ (固定)
    this.ui.renderSlideHeader(slide, title || 'Process Flow');

    const baseX = this.config.layout.baseX; // 0.5 インチ (固定)
    const safeW = this.config.layout.safeW; // 9.0 インチ (固定)
    const totalH = 3.8;                     // スイムレーン本体が使用できる有効な高さ (5.1 - 1.1 = 4.0 からバッファを引いて 3.8)

    // ==========================================
    // 🧪 一般化されたデータスケーリング計算
    // ==========================================
    const laneCount = lanes.length;
    const stepCount = steps.length;

    // 縮小倍率の下限リミッターを極限拡張 (React UI と完全同期)
    const laneScale = Math.max(0.35, 4 / Math.max(4, laneCount));
    const stepScale = Math.max(0.3, 8 / Math.max(8, stepCount));

    // 高密度判定 (ある一定のレーン数・ステップ数を超えた場合)
    const isHighDensity = laneCount > 5 || stepCount > 8;

    // 各セルの計算 (インチ)
    const laneColW = 1.4;                                // 左端のレーン名カラム幅 (Reactの14cqiに同期してバッジスペース用に1.4に拡張)
    const stepsTotalW = safeW - laneColW;                 // ステップエリア全体の幅 (9.0 - 1.4 = 7.6)
    const stepColW = stepsTotalW / stepCount;             // 1ステップあたりの幅
    const laneRowH = totalH / laneCount;                  // 1レーンあたりの高さ

    // 文字サイズの動的スケーリング (pt単位, Reactのcqiマッピング)
    const laneLabelFontSize = Math.max(5.5, 9.2 * laneScale);
    const stepNumFontSize = Math.max(4.5, 8 * stepScale);
    const stepTitleFontSize = Math.max(5.0, 9 * stepScale);
    const stepDescFontSize = Math.max(4.5, 8 * stepScale);
    const stepPayloadFontSize = Math.max(4.0, 7 * stepScale);

    // ==========================================
    // 🎨 スケマティックカラー＆トポロジー定義 (Reactと同期)
    // ==========================================

    // A. アクター（レーン）のシステムトポロジー別バッジ＆水平背景色定義 (16進数カラーコード)
    const typeConfigs: { [key: string]: { bg: string, text: string, border: string, badge: string } } = {
      client: { bg: 'EFF6FF', text: '1E40AF', border: 'BFDBFE', badge: '🖥️ CLIENT' },
      frontend: { bg: 'F5F3FF', text: '5B21B6', border: 'DDD6FE', badge: '💻 WEB UI' },
      gateway: { bg: 'F1F5F9', text: '334155', border: 'E2E8F0', badge: '⚙️ GATEWAY' },
      service: { bg: 'ECFDF5', text: '065F46', border: 'A7F3D0', badge: '📦 SERVICE' },
      database: { bg: 'FAF5FF', text: '6B21A8', border: 'E9D5FF', badge: '💾 DATABASE' },
      external: { bg: 'FEF3C7', text: '92400E', border: 'FDE68A', badge: '🌐 EXT API' }
    };

    // B. 論理フェーズ（縦ゾーニング）のカラーパレット定義
    const phaseColors: { [key: string]: { bg: string, border: string, text: string } } = {
      blue: { bg: 'DBEAFE', border: '3B82F6', text: '2563EB' },
      indigo: { bg: 'E0E7FF', border: '6366F1', text: '4F46E5' },
      emerald: { bg: 'D1FAE5', border: '10B981', text: '059669' },
      gold: { bg: 'FEF3C7', border: 'F59E0B', text: 'D97706' }
    };

    // C. 接続線の系統カラー定義
    const lineColors: { [key: string]: string } = {
      primary: this.config.colors.primary,
      blue: '3B82F6',
      purple: '8B5CF6',
      green: '10B981',
      default: this.config.colors.primary
    };

    // =========================================================
    // 🌟 Z-Order設計: 最背面にアクター背景 ➡️ 縦フェーズ背景 ➡️ 線 ➡️ テキスト
    // =========================================================

    // --- 🌟 Z-Order LAYER 1: 最背面にアクター水平背景を描画 (transparency: 96 / デフォルト枠線完全排除) ---
    for (let i = 0; i < laneCount; i++) {
      const y = startY + i * laneRowH;
      const lane = lanes[i];
      const typeInfo = typeConfigs[lane.type];

      if (lane.type && typeInfo) {
        slide.addShape(this.pptx.ShapeType.rect, {
          x: baseX + laneColW,
          y: y,
          w: stepsTotalW,
          h: laneRowH,
          fill: { color: typeInfo.bg, transparency: 96 },
          line: { color: typeInfo.bg, width: 0 } // 同じ背景色 ＆ 幅0 でデフォルト枠線を完璧に抹消！
        });
      }
    }

    // --- 🌟 Z-Order LAYER 2: 縦の論理フェーズカラー帯の描画 (transparency: 92 / 枠線排除) ---
    if (phases && phases.length > 0) {
      const timelineX = baseX + laneColW;
      const timelineW = stepsTotalW;

      for (let p = 0; p < phases.length; p++) {
        const phase = phases[p];
        const start = phase.start_step || 1;
        const end = phase.end_step || stepCount;
        
        // インチ座標計算
        const px = timelineX + (start - 1) * stepColW;
        const pw = (end - start + 1) * stepColW;
        const col = phaseColors[phase.color] || phaseColors.blue;

        // 背景カラーブロック (transparency: 92 / デフォルト枠線完全排除)
        slide.addShape(this.pptx.ShapeType.rect, {
          x: px,
          y: startY,
          w: pw,
          h: totalH,
          fill: { color: col.bg, transparency: 92 },
          line: { color: col.bg, width: 0 } // 同じ背景色 ＆ 幅0 でデフォルト枠線を完璧に抹消！
        });

        // 境界の極細ダッシュ区切り線 (最初のフェーズの左端以外 - 0.75ptの超上品な線)
        if (p > 0) {
          slide.addShape(this.pptx.ShapeType.line, {
            x: px,
            y: startY,
            w: 0,
            h: totalH,
            line: { color: col.border, width: 0.75, dashType: 'dash' }
          });
        }

        // フェーズ名見出し (最前面に完璧に露出)
        slide.addText(phase.name || '', {
          x: px + 0.08,
          y: startY + 0.05,
          w: pw - 0.16,
          h: 0.25,
          fontSize: 7.5,
          bold: true,
          color: col.text,
          valign: 'top',
          align: 'left',
          margin: 0
        });
      }
    }

    // --- 🌟 Z-Order LAYER 3: 左端アクター名 ＆ 真の角丸極小バッジ (roundRect) の描画 ---
    for (let i = 0; i < laneCount; i++) {
      const y = startY + i * laneRowH;
      const lane = lanes[i];
      const typeInfo = typeConfigs[lane.type];

      // A. 角丸極小バッジの描画 (指定がある場合のみ - 上寄せ ＆ 左詰め)
      if (lane.type && typeInfo) {
        const bx = baseX;                           // 完全左詰め (0.5 インチ)
        const bh = Math.min(0.14, laneRowH * 0.30); // 縦をさらにスリムでスマートに縮小
        const by = y + laneRowH * 0.12;             // セル内の上部にマウント
        const bw = 0.65;                            // 幅を0.65にスリム化し、左右余白を究極に洗練

        // 本物の角丸矩形図形を追加 (0.5pt の極細バッジ枠線)
        slide.addShape(this.pptx.ShapeType.roundRect, {
          x: bx,
          y: by,
          w: bw,
          h: bh,
          fill: { color: typeInfo.bg },
          line: { color: typeInfo.border, width: 0.5 }, // 極細0.5ptの枠線
          rectRadius: 0.2
        });

        // バッジテキストをその上にぴったり重ねる
        slide.addText(typeInfo.badge, {
          x: bx,
          y: by,
          w: bw,
          h: bh,
          fontSize: Math.max(4.5, laneLabelFontSize * 0.65), // バッジに合わせて文字を微調整
          bold: true,
          color: typeInfo.text,
          align: 'center',
          valign: 'middle',
          margin: 0
        });
      }

      // B. アクター名の描画 (バッジがある場合はその下から左詰め、ない場合は中央から左詰め)
      const lx = baseX;                                               // バッジの有無に関わらず常に完全左詰め！
      const ly = lane.type ? y + laneRowH * 0.46 : y;                 // バッジがある場合は下寄せ、ない場合は垂直中央
      const lh = lane.type ? laneRowH * 0.5 : laneRowH;
      const lw = laneColW - 0.05;

      slide.addText(lane.label || '', {
        x: lx,
        y: ly,
        w: lw,
        h: lh,
        fontSize: laneLabelFontSize,
        bold: true,
        color: this.config.colors.text.header,
        valign: lane.type ? 'top' : 'middle',                         // バッジがある場合は上揃えにしてバッジとの隙間を適正化
        align: 'left',
        margin: 0
      });

      // C. レーン区切り水平線 (ShapeType.line による 0.5pt 極細薄グレー線。最後の行の下線は除外)
      if (i < laneCount - 1) {
        slide.addShape(this.pptx.ShapeType.line, {
          x: baseX,
          y: y + laneRowH,
          w: safeW,
          h: 0,
          line: { color: 'E2E8F0', width: 0.5 } // 0.5ptの極細グレー線で圧倒的に上品に！
        });
      }
    }

    // --- 🌟 Z-Order LAYER 4: 直角・極細のフロー線 (点線・実線 ＆ 系統カラー) ---
    for (let j = 0; j < stepCount; j++) {
      const step = steps[j];
      const nextStep = steps[j + 1] || (step.flow_to ? steps.find((s: any) => s.lane === step.flow_to) : null);
      if (!nextStep && !step.flow_to) continue;

      const lane1 = lanes.findIndex((l: any) => l.id === step.lane);
      const lane2 = nextStep ? lanes.findIndex((l: any) => l.id === nextStep.lane) : lanes.findIndex((l: any) => l.id === step.flow_to);

      if (lane1 === -1 || lane2 === -1) continue;

      // 座標の絶対インチ計算
      const x1 = baseX + laneColW + j * stepColW + (stepColW * 0.1);
      const x2 = baseX + laneColW + (j + 1) * stepColW + (stepColW * 0.1);
      const y1 = startY + (lane1 + 0.5) * laneRowH;
      const y2 = startY + (lane2 + 0.5) * laneRowH;

      // スキーマ指定のフローカラーおよびスタイル（点線・実線）に同期
      const isDashed = step.flow_style === 'dashed';
      const color = lineColors[step.flow_color] || lineColors.default;

      const lineWidth = isDashed ? 1.5 : 1.0;
      const lineDashType = isDashed ? 'dash' : 'solid';

      if (lane1 === lane2) {
        // 同一レーン内の水平線
        slide.addShape(this.pptx.ShapeType.line, {
          x: x1,
          y: y1,
          w: x2 - x1,
          h: 0,
          line: { color: color, width: lineWidth, dashType: lineDashType }
        });
      } else {
        // 異なるレーン間の直角クランク線
        // 1. 前半水平線
        slide.addShape(this.pptx.ShapeType.line, {
          x: x1,
          y: y1,
          w: (x2 - x1) / 2,
          h: 0,
          line: { color: color, width: lineWidth, dashType: lineDashType }
        });
        // 2. 中間垂直線
        slide.addShape(this.pptx.ShapeType.line, {
          x: x1 + (x2 - x1) / 2,
          y: Math.min(y1, y2),
          w: 0,
          h: Math.abs(y2 - y1),
          line: { color: color, width: lineWidth, dashType: lineDashType }
        });
        // 3. 後半水平線
        slide.addShape(this.pptx.ShapeType.line, {
          x: x1 + (x2 - x1) / 2,
          y: y2,
          w: (x2 - x1) / 2,
          h: 0,
          line: { color: color, width: lineWidth, dashType: lineDashType }
        });
      }
    }

    // --- 🌟 Z-Order LAYER 5: ステップカードの描画 (白背景マスク ＆ 0.5pt極細枠線) ---
    for (let j = 0; j < stepCount; j++) {
      const step = steps[j];
      const laneIdx = lanes.findIndex((l: any) => l.id === step.lane);
      if (laneIdx === -1) continue;

      const x = baseX + laneColW + j * stepColW;
      const y = startY + laneIdx * laneRowH;

      // 1. 受信用の三角形（矢印）の描画 (2番目のステップ以降)
      if (j > 0) {
        const arrowW = isHighDensity ? 0.025 : 0.05;
        const arrowH = isHighDensity ? 0.035 : 0.07;
        const arrowX = x - arrowW / 2;
        const arrowY = y + laneRowH / 2 - arrowH / 2;

        slide.addShape(this.pptx.ShapeType.triangle, {
          x: arrowX,
          y: arrowY,
          w: arrowW,
          h: arrowH,
          fill: { color: this.config.colors.primary },
          line: { color: 'none' },
          rotate: 90
        });
      }

      // 2. リッチテキストデータの構築 (番号、タイトル、説明、ペイロードを縦方向に結合)
      const textRuns: any[] = [];

      // 2-a. ステップ連番 (例: 01)
      textRuns.push({
        text: `${String(j + 1).padStart(2, '0')}\n`,
        options: {
          fontSize: stepNumFontSize,
          color: this.config.colors.primary,
          bold: true,
          fontFace: 'Courier New'
        }
      });

      // 2-b. ステップタイトル
      textRuns.push({
        text: `${step.title || ''}\n`,
        options: {
          fontSize: stepTitleFontSize,
          color: this.config.colors.text.header,
          bold: true
        }
      });

      // 🧪 インテリジェント表示制限: 高密度時は description と payload を「わざと」非表示にする (スライドはみ出し防止)
      if (!isHighDensity) {
        // 2-c. ステップ説明
        if (step.description) {
          textRuns.push({
            text: `${step.description}\n`,
            options: {
              fontSize: stepDescFontSize,
              color: this.config.colors.text.body
            }
          });
        }

        // 2-d. ペイロード (JSON/SQLなどのソースコード)
        if (step.payload) {
          textRuns.push({
            text: step.payload,
            options: {
              fontSize: stepPayloadFontSize,
              color: this.config.colors.text.body,
              fontFace: 'Courier New',
              italic: true
            }
          });
        }
      }

      // 3. テキストボックスの描画 (背景を白で塗りつぶし ＆ 極細0.5ptの薄グレー境界線で完璧に浮かび上がらせる)
      slide.addText(textRuns, {
        x: x + stepColW * 0.05,
        y: y + laneRowH * 0.1,
        w: stepColW * 0.9,
        h: laneRowH * 0.8,
        valign: 'middle',
        align: 'left',
        margin: isHighDensity ? 1 : 3,
        fill: { color: 'FFFFFF' },                  // 白背景マスク
        line: { color: 'E2E8F0', width: 0.5 }        // 0.5ptの上品で極細の薄グレー枠線
      });
    }

    // --- 4. フッター描画 (他スライドと完全に同一の固定位置) ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
