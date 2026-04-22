/**
 * useMention - ファイルメンション機能のカスタムフック
 *
 * @トリガーによるファイル名自動補完のロジックをカプセル化する。
 * 3段構えのインテリジェンス・フィルターにより、メールアドレス等との競合を回避。
 *
 * フィルター構成:
 * 1. 先行コンテキスト検知 - @の直前が文頭/スペース/改行のみトリガー
 * 2. オートフィルタリング - 候補0件で自動クローズ
 * 3. マニュアルエスケープ - Escキーでキャンセル
 */
import { useState, useCallback, useRef } from 'react';

// ファイル候補の型定義
export interface MentionFile {
  name: string;
  id?: string;
}

// ポップオーバー座標の型定義
export interface PopoverPosition {
  x: number;
  y: number;
}

// フックの返り値の型定義
export interface UseMentionReturn {
  // 状態
  showPopover: boolean;
  mentionQuery: string;
  selectedIndex: number;
  popoverPosition: PopoverPosition;
  filteredFiles: MentionFile[];

  // イベントハンドラ
  handleInput: (editorEl: HTMLDivElement) => void;
  handleKeyDown: (e: React.KeyboardEvent, editorEl: HTMLDivElement) => boolean;
  confirmMention: (file: MentionFile, editorEl: HTMLDivElement) => void;
  resetMention: () => void;

  // ユーティリティ
  getPlainTextWithMentions: (editorEl: HTMLDivElement) => string;
  isComposing: boolean;
  setIsComposing: (v: boolean) => void;
}

/**
 * @param availableFiles - メンション候補として表示可能なファイル一覧
 */
export const useMention = (availableFiles: MentionFile[]): UseMentionReturn => {
  const [showPopover, setShowPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({ x: 0, y: 0 });
  
  // IME入力中フラグ。ハンドラから即座に参照できるよう useRef を使用する。
  const isComposingRef = useRef(false);
  const setIsComposing = useCallback((v: boolean) => {
    isComposingRef.current = v;
  }, []);

  // @文字のDOM位置を記憶するRef（確定時に@テキストを置換するため）
  const mentionAnchorRef = useRef<{ node: Node; offset: number } | null>(null);

  // --- フィルタリング ---
  // mentionQuery でファイル候補を絞り込み（部分一致、大文字小文字無視）
  const filteredFiles = availableFiles.filter(file =>
    file.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  /**
   * 先行コンテキスト検知（フィルター1）
   * @の直前が「文頭」「スペース」「改行」の場合のみ true を返す
   */
  const shouldTriggerMention = useCallback((editorEl: HTMLDivElement): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    // テキストノード内の場合
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container.textContent || '';
      const offset = range.startOffset;

      // @が打たれた直前の文字を確認（offsetは@の後にカーソルがある位置）
      // @はまだ入力されたばかりなので、offset-1 が @ の位置
      const atPos = offset - 1;
      if (atPos < 0) return false;
      if (text[atPos] !== '@' && text[atPos] !== '＠') return false;

      // 文頭の場合
      if (atPos === 0) {
        // テキストノードが最初の子要素であれば文頭とみなす
        const parentEl = container.parentElement;
        if (!parentEl) return true;
        // 前の兄弟ノードがない場合は文頭
        if (!container.previousSibling) return true;
        // 前がmentionPillの場合もOK（pill直後の@はトリガー可能）
        const prevSibling = container.previousSibling;
        if (prevSibling instanceof HTMLElement && prevSibling.classList.contains('mention-pill')) {
          return true;
        }
        return true; // テキストノードの先頭は基本的にOK
      }

      // @の直前の文字がスペースまたは改行かチェック
      const charBefore = text[atPos - 1];
      return charBefore === ' ' || charBefore === '\n' || charBefore === '\u00A0'; // 通常スペース、改行、NBSP
    }

    return false;
  }, []);

  /**
   * カーソル位置からポップオーバー座標を計算
   */
  const calculatePopoverPosition = useCallback((): PopoverPosition => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { x: 0, y: 0 };

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
      x: rect.left,
      y: rect.top, // ポップオーバーはカーソルの上に表示（bottom-upで配置するため上端を指定）
    };
  }, []);

  /**
   * handleInput - テキスト入力時のハンドラ
   * @キーの検出と絞り込みクエリの更新を行う
   */
  const handleInput = useCallback((editorEl: HTMLDivElement) => {
    // IME入力中は何もしない
    if (isComposingRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (showPopover) {
      // ポップオーバー表示中: クエリを更新
      const range = selection.getRangeAt(0);
      const container = range.startContainer;

      if (container.nodeType === Node.TEXT_NODE && mentionAnchorRef.current && container === mentionAnchorRef.current.node) {
        const text = container.textContent || '';
        const cursorOffset = range.startOffset;
        const anchorOffset = mentionAnchorRef.current.offset;

        // カーソル位置が @ より前に戻ってしまった（または @ 自体が消された）場合はキャンセル
        if (cursorOffset < anchorOffset) {
          setShowPopover(false);
          mentionAnchorRef.current = null;
          return;
        }

        // @の位置からカーソル位置までのテキストを取得
        const query = text.substring(anchorOffset, cursorOffset);
        setMentionQuery(query);
        setSelectedIndex(0);

        // オートフィルタリング（フィルター2）:
        // 候補が0件 AND クエリが空でない場合はポップオーバーを閉じる
        const currentFiltered = availableFiles.filter(file =>
          file.name.toLowerCase().includes(query.toLowerCase())
        );
        if (query.length > 0 && currentFiltered.length === 0) {
          setShowPopover(false);
          mentionAnchorRef.current = null;
          return;
        }

        // ポップオーバー位置更新
        setPopoverPosition(calculatePopoverPosition());
      } else {
        // テキストノードが変わった、またはテキスト全体が消去された場合 → ポップオーバーを閉じる
        setShowPopover(false);
        mentionAnchorRef.current = null;
      }
    } else {
      // ポップオーバー非表示: @の検出
      if (shouldTriggerMention(editorEl)) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;

        // @の次の位置をアンカーとして記憶
        mentionAnchorRef.current = { node: container, offset: offset };

        setShowPopover(true);
        setMentionQuery('');
        setSelectedIndex(0);
        setPopoverPosition(calculatePopoverPosition());
      }
    }
  }, [showPopover, shouldTriggerMention, calculatePopoverPosition, availableFiles]);

  /**
   * handleKeyDown - キーボードイベントのハンドラ
   * ポップオーバー表示中のナビゲーション・確定・キャンセルを制御
   * @returns true: イベントを消費（親への伝搬をブロック）、false: 通常通り処理
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, editorEl: HTMLDivElement): boolean => {
    // === ポップオーバー非表示時の処理（Backspaceによる即時削除） ===
    if (!showPopover) {
      if (e.key === 'Backspace') {
        const selection = window.getSelection();
        if (selection && selection.isCollapsed && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.startContainer;
          const offset = range.startOffset;

          // ケース1: テキストノードの先頭にカーソルがあり、直前の要素がPillの場合
          if (container.nodeType === Node.TEXT_NODE && offset === 0) {
            const prevSibling = container.previousSibling;
            if (prevSibling instanceof HTMLElement && prevSibling.classList.contains('mention-pill')) {
              e.preventDefault();
              prevSibling.remove();
              editorEl.dispatchEvent(new Event('input', { bubbles: true }));
              return true;
            }
          }
          // ケース2: 親要素（div等）がコンテナで、カーソル直前の子要素がPillの場合
          else if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
            const nodeBeforeCursor = container.childNodes[offset - 1];
            if (nodeBeforeCursor instanceof HTMLElement && nodeBeforeCursor.classList.contains('mention-pill')) {
              e.preventDefault();
              nodeBeforeCursor.remove();
              editorEl.dispatchEvent(new Event('input', { bubbles: true }));
              return true;
            }
          }
        }
      }
      return false;
    }

    // === ポップオーバー表示中の処理 ===
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredFiles.length - 1));
        return true;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return true;

      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredFiles.length > 0 && selectedIndex < filteredFiles.length) {
          confirmMention(filteredFiles[selectedIndex], editorEl);
        }
        return true;

      case 'Escape':
        // マニュアルエスケープ（フィルター3）
        e.preventDefault();
        setShowPopover(false);
        mentionAnchorRef.current = null;
        return true;

      default:
        return false;
    }
  }, [showPopover, filteredFiles, selectedIndex]);

  /**
   * confirmMention - メンション確定処理
   * @テキストを削除し、Mention Pill (span要素) をDOMに挿入する
   */
  const confirmMention = useCallback((file: MentionFile, editorEl: HTMLDivElement) => {
    const selection = window.getSelection();
    if (!selection || !mentionAnchorRef.current) return;

    const anchorNode = mentionAnchorRef.current.node;
    const anchorOffset = mentionAnchorRef.current.offset;

    // 現在のカーソル位置
    const range = selection.getRangeAt(0);
    const currentOffset = range.startOffset;

    // テキストノードから @query テキストを削除
    if (anchorNode.nodeType === Node.TEXT_NODE && anchorNode.textContent) {
      const text = anchorNode.textContent;
      // @の位置（anchorOffset - 1 から currentOffset まで）を削除
      const beforeAt = text.substring(0, anchorOffset - 1); // @の前
      const afterQuery = text.substring(currentOffset); // カーソル後

      // Mention Pill (span) を生成
      const pill = document.createElement('span');
      pill.className = 'mention-pill';
      pill.contentEditable = 'false'; // 編集不可の独立要素
      pill.setAttribute('data-filename', file.name);
      pill.textContent = `📄 ${file.name}`;

      // テキストノードを分割して Pill を挿入
      const parentNode = anchorNode.parentNode;
      if (!parentNode) return;

      // @の前のテキスト
      const beforeTextNode = document.createTextNode(beforeAt);
      // @の後のテキスト（スペースを先頭に追加してカーソルが見えるようにする）
      const afterTextNode = document.createTextNode('\u00A0' + afterQuery);

      // 元のテキストノードを新しいノードで置換
      parentNode.insertBefore(beforeTextNode, anchorNode);
      parentNode.insertBefore(pill, anchorNode);
      parentNode.insertBefore(afterTextNode, anchorNode);
      parentNode.removeChild(anchorNode);

      // カーソルをPillの直後（afterTextNodeの先頭のスペースの後）に配置
      const newRange = document.createRange();
      newRange.setStart(afterTextNode, 1); // NBSPの後にカーソル
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // 状態リセット
    setShowPopover(false);
    setMentionQuery('');
    setSelectedIndex(0);
    mentionAnchorRef.current = null;

    // inputイベントを発火させてonChangeを呼ぶ
    editorEl.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  /**
   * resetMention - メンション状態を完全リセット
   */
  const resetMention = useCallback(() => {
    setShowPopover(false);
    setMentionQuery('');
    setSelectedIndex(0);
    setPopoverPosition({ x: 0, y: 0 });
    mentionAnchorRef.current = null;
  }, []);

  /**
   * getPlainTextWithMentions - DOM内容からプレーンテキストを抽出
   *
   * Mention Pill は data-filename の値に置換される。
   * これにより、Dify側には「ユーザーが手入力でファイル名を指定した」テキストとして送信される。
   */
  const getPlainTextWithMentions = useCallback((editorEl: HTMLDivElement): string => {
    if (!editorEl) return '';

    let result = '';
    const childNodes = editorEl.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];

      if (node.nodeType === Node.TEXT_NODE) {
        // プレーンテキスト
        result += node.textContent || '';
      } else if (node instanceof HTMLElement) {
        if (node.classList.contains('mention-pill')) {
          // Mention Pill → ファイル名テキストに変換
          const filename = node.getAttribute('data-filename') || '';
          result += filename;
        } else if (node.tagName === 'BR') {
          // 改行
          result += '\n';
        } else {
          // その他の要素は再帰的にテキストを抽出
          result += node.textContent || '';
        }
      }
    }

    // NBSP(0x00A0) を通常スペースに変換
    return result.replace(/\u00A0/g, ' ').trim();
  }, []);

  return {
    showPopover,
    mentionQuery,
    selectedIndex,
    popoverPosition,
    filteredFiles,
    handleInput,
    handleKeyDown,
    confirmMention,
    resetMention,
    getPlainTextWithMentions,
    isComposing: isComposingRef.current,
    setIsComposing,
  };
};

export default useMention;
