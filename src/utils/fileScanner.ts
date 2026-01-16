// src/utils/fileScanner.ts
/**
 * ファイルスキャンユーティリティ
 * The Intelligent Guardian - Pre-flight Document Scan
 * 
 * ファイルアップロード前にブラウザ内で機密情報をスキャンする
 */

import { scanText, Detection } from './privacyDetector';

/**
 * スキャンステータスの型定義
 */
export type ScanStatus = 'completed' | 'skipped' | 'error';

/**
 * スキャン結果の型定義
 */
export interface FileScanResult {
    file: File;
    scanStatus: ScanStatus;
    hasWarning: boolean;
    detections: Detection[];
}

/**
 * ファイル検知結果の型定義
 */
export interface FileDetectionResult {
    fileName: string;
    detections: Detection[];
}

// スキャン対象のテキスト形式拡張子
const TEXT_EXTENSIONS: string[] = ['.txt', '.md', '.json'];

// 最大スキャンサイズ（1MB）- 大きなファイルは先頭部分のみスキャン
const MAX_SCAN_SIZE = 1024 * 1024;

/**
 * ファイルの拡張子を取得
 * @param filename - ファイル名
 * @returns 小文字の拡張子（例: '.txt'）
 */
function getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.slice(lastDot).toLowerCase();
}

/**
 * ファイルがスキャン対象かどうかを判定
 * @param filename - ファイル名
 * @returns boolean
 */
export function isScannableFile(filename: string): boolean {
    return TEXT_EXTENSIONS.includes(getExtension(filename));
}

/**
 * ファイルをテキストとして読み込む
 * @param file - ファイルオブジェクト
 * @returns ファイル内容
 */
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target?.result as string);
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
 * @param file - スキャン対象のファイル
 * @returns スキャン結果を含むオブジェクト
 */
export async function scanFile(file: File): Promise<FileScanResult> {
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
 * @param files - スキャン対象のファイル配列
 * @returns スキャン結果の配列
 */
export async function scanFiles(files: File[]): Promise<FileScanResult[]> {
    const results = await Promise.all(files.map(scanFile));
    return results;
}

/**
 * スキャン結果から警告があるか判定
 * @param scannedFiles - スキャン結果の配列
 * @returns boolean
 */
export function hasFileWarnings(scannedFiles: FileScanResult[]): boolean {
    return scannedFiles.some(sf => sf.hasWarning);
}

/**
 * スキャン結果から全ての検知結果をマージ
 * @param scannedFiles - スキャン結果の配列
 * @returns 検知結果の配列（ファイル名付き）
 */
export function getFileDetections(scannedFiles: FileScanResult[]): FileDetectionResult[] {
    const detections: FileDetectionResult[] = [];

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
