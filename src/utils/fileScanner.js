// src/utils/fileScanner.js
/**
 * ファイルスキャンユーティリティ
 * The Intelligent Guardian - Pre-flight Document Scan
 * 
 * ファイルアップロード前にブラウザ内で機密情報をスキャンする
 */

import { scanText } from './privacyDetector';

// スキャン対象のテキスト形式拡張子
const TEXT_EXTENSIONS = ['.txt', '.md', '.json'];

// 最大スキャンサイズ（1MB）- 大きなファイルは先頭部分のみスキャン
const MAX_SCAN_SIZE = 1024 * 1024;

/**
 * ファイルの拡張子を取得
 * @param {string} filename - ファイル名
 * @returns {string} - 小文字の拡張子（例: '.txt'）
 */
function getExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * ファイルがスキャン対象かどうかを判定
 * @param {string} filename - ファイル名
 * @returns {boolean}
 */
export function isScannableFile(filename) {
  return TEXT_EXTENSIONS.includes(getExtension(filename));
}

/**
 * ファイルをテキストとして読み込む
 * @param {File} file - ファイルオブジェクト
 * @returns {Promise<string>} - ファイル内容
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    
    // 大きなファイルは先頭部分のみ読み込む
    if (file.size > MAX_SCAN_SIZE) {
      const blob = file.slice(0, MAX_SCAN_SIZE);
      reader.readAsText(blob);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * 単一ファイルをスキャンする
 * @param {File} file - スキャン対象のファイル
 * @returns {Promise<Object>} - スキャン結果を含むオブジェクト
 */
export async function scanFile(file) {
  const ext = getExtension(file.name);
  
  // スキャン対象外の場合
  if (!TEXT_EXTENSIONS.includes(ext)) {
    return {
      file,
      scanStatus: 'skipped',
      hasWarning: false,
      detections: [],
    };
  }
  
  try {
    const content = await readFileAsText(file);
    const result = scanText(content);
    
    return {
      file,
      scanStatus: 'completed',
      hasWarning: result.hasWarning,
      detections: result.detections,
    };
  } catch (error) {
    console.error('ファイルスキャンエラー:', error);
    return {
      file,
      scanStatus: 'error',
      hasWarning: false,
      detections: [],
    };
  }
}

/**
 * 複数ファイルをスキャンする
 * @param {File[]} files - スキャン対象のファイル配列
 * @returns {Promise<Object[]>} - スキャン結果の配列
 */
export async function scanFiles(files) {
  const results = await Promise.all(files.map(scanFile));
  return results;
}

/**
 * スキャン結果から警告があるか判定
 * @param {Object[]} scannedFiles - スキャン結果の配列
 * @returns {boolean}
 */
export function hasFileWarnings(scannedFiles) {
  return scannedFiles.some(sf => sf.hasWarning);
}

/**
 * スキャン結果から全ての検知結果をマージ
 * @param {Object[]} scannedFiles - スキャン結果の配列
 * @returns {Object[]} - 検知結果の配列（ファイル名付き）
 */
export function getFileDetections(scannedFiles) {
  const detections = [];
  
  for (const sf of scannedFiles) {
    if (sf.hasWarning && sf.detections.length > 0) {
      detections.push({
        fileName: sf.file.name,
        detections: sf.detections,
      });
    }
  }
  
  return detections;
}

export default {
  scanFile,
  scanFiles,
  isScannableFile,
  hasFileWarnings,
  getFileDetections,
};
