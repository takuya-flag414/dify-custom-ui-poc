import pptxgen from 'pptxgenjs';
import { BaseRenderer } from './BaseRenderer';
import { ThemeConfig, SlideData } from '../types';

export type RendererConstructor = new (pptx: pptxgen, config: ThemeConfig) => BaseRenderer;

/**
 * テーマごとのスライドレンダラーを管理するレジストリ
 */
export class RendererRegistry {
  private renderers: Map<string, RendererConstructor> = new Map();

  /**
   * レンダラーを登録する
   * @param type スライドタイプ (例: 'title', 'content')
   * @param renderer レンダラークラス
   */
  public register(type: string, renderer: RendererConstructor) {
    this.renderers.set(type.toLowerCase(), renderer);
  }

  /**
   * レンダラーを取得する
   */
  public getRenderer(type: string): RendererConstructor | undefined {
    return this.renderers.get(type.toLowerCase());
  }

  /**
   * 複数のレンダラーを一括登録する
   */
  public registerAll(mapping: Record<string, RendererConstructor>) {
    Object.entries(mapping).forEach(([type, renderer]) => {
      this.register(type, renderer);
    });
  }
}

/**
 * テーマごとのレジストリを保持するグローバルレジストリ
 */
export class ThemeRegistry {
  private themes: Map<string, { config: ThemeConfig | ((palette?: any) => ThemeConfig), registry: RendererRegistry }> = new Map();

  public registerTheme(name: string, config: ThemeConfig | ((palette?: any) => ThemeConfig), registry: RendererRegistry) {
    this.themes.set(name, { config, registry });
  }

  public getTheme(name: string, palette?: any) {
    const theme = this.themes.get(name);
    if (!theme) return undefined;

    const config = typeof theme.config === 'function' ? theme.config(palette) : theme.config;
    return { config, registry: theme.registry };
  }
}

export const globalThemeRegistry = new ThemeRegistry();
