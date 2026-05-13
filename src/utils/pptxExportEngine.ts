/**
 * PPTXエクスポートエンジンのエントリーポイント
 * 
 * このファイルは後方互換性のために残されており、
 * 実装の詳細は src/utils/pptx/ フォルダ配下に整理されています。
 */

import './pptx/themes/modern-indigo'; // テーマの登録を確実に行う
import { PptxExportEngine as NewEngine } from './pptx/engine';
import { ExportOptions, SlideData, SlideContent } from './pptx/types';

export type { SlideContent, SlideData, ExportOptions };

/**
 * PPTX変換を行うコアエンジンクラス（ラップ版）
 */
export class PptxExportEngine {
  private engine: NewEngine;

  constructor(options: ExportOptions) {
    this.engine = new NewEngine(options);
  }

  /**
   * エクスポート処理
   * @param slides 変換対象のスライドデータ配列
   */
  public async export(slides: any[]) {
    return this.engine.export(slides);
  }
}
