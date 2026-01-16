// src/components/DevTools/TestPanel.jsx
// DESIGN_RULE.md準拠: 自動テストパネル

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { basicTests, apiTests, TEST_CATEGORIES } from '../../tests';
import './TestPanel.css';

// アイコン
const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const XIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// Spring animation設定 (DESIGN_RULE: Standard UI Transition)
const springTransition = {
    type: 'spring',
    stiffness: 250,
    damping: 25,
    mass: 1,
};

// テスト結果の初期状態
const createInitialResults = () => {
    const results = {};
    [...basicTests, ...apiTests].forEach(test => {
        results[test.id] = { status: 'pending', time: null, message: null };
    });
    return results;
};

const TestPanel = ({
    isOpen,
    onClose,
    mockMode,
    addLog,
    // チャット機能テスト用のcontext
    handleSendMessage,
    messages,
    apiKey,
    apiUrl,
    userId,
}) => {
    const [results, setResults] = useState(createInitialResults);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedTests, setSelectedTests] = useState(() => {
        const selected = {};
        [...basicTests, ...apiTests].forEach(test => {
            selected[test.id] = true;
        });
        return selected;
    });

    // モードに応じた有効テスト判定
    const isApiTestsEnabled = mockMode !== 'FE';

    // テスト実行
    const runTest = useCallback(async (test) => {
        const startTime = Date.now();

        setResults(prev => ({
            ...prev,
            [test.id]: { status: 'running', time: null, message: null },
        }));

        try {
            const context = {
                mockMode,
                addLog,
                handleSendMessage,
                messages,
                apiKey,
                apiUrl,
                userId,
            };

            const result = await test.run(context);
            const elapsed = Date.now() - startTime;

            setResults(prev => ({
                ...prev,
                [test.id]: {
                    status: result.success ? 'pass' : 'fail',
                    time: elapsed,
                    message: result.message,
                    skipped: result.skipped,
                },
            }));

            return result.success;
        } catch (e) {
            const elapsed = Date.now() - startTime;
            setResults(prev => ({
                ...prev,
                [test.id]: {
                    status: 'fail',
                    time: elapsed,
                    message: e.message,
                },
            }));
            return false;
        }
    }, [mockMode, addLog, handleSendMessage, messages, apiKey, apiUrl, userId]);

    // 全テスト実行
    const runAllTests = useCallback(async () => {
        setIsRunning(true);
        addLog?.('[TestPanel] 全テスト開始', 'info');

        // 基本テストを実行
        for (const test of basicTests) {
            if (selectedTests[test.id]) {
                await runTest(test);
            }
        }

        // APIテストを実行（対象モードのみ）
        if (isApiTestsEnabled) {
            for (const test of apiTests) {
                if (selectedTests[test.id]) {
                    await runTest(test);
                }
            }
        }

        setIsRunning(false);
        addLog?.('[TestPanel] 全テスト完了', 'info');
    }, [selectedTests, isApiTestsEnabled, runTest, addLog]);

    // 結果をコピー
    const copyResults = useCallback(() => {
        const summary = {
            mode: mockMode,
            timestamp: new Date().toISOString(),
            results: Object.entries(results).map(([id, result]) => ({
                id,
                ...result,
            })),
        };
        navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
        addLog?.('[TestPanel] 結果をコピーしました', 'info');
    }, [results, mockMode, addLog]);

    // チェックボックス切り替え
    const toggleTest = useCallback((testId) => {
        setSelectedTests(prev => ({
            ...prev,
            [testId]: !prev[testId],
        }));
    }, []);

    // サマリー計算
    const summary = useMemo(() => {
        const allResults = Object.values(results);
        const completed = allResults.filter(r => r.status === 'pass' || r.status === 'fail');
        const passed = allResults.filter(r => r.status === 'pass');
        const failed = allResults.filter(r => r.status === 'fail');
        return {
            total: allResults.length,
            completed: completed.length,
            passed: passed.length,
            failed: failed.length,
        };
    }, [results]);

    // テストアイテムレンダリング
    const renderTestItem = (test, disabled = false) => {
        const result = results[test.id];
        return (
            <div key={test.id} className="test-item">
                <label className="test-item-name">
                    <input
                        type="checkbox"
                        className="test-item-checkbox"
                        checked={selectedTests[test.id]}
                        onChange={() => toggleTest(test.id)}
                        disabled={disabled || isRunning}
                    />
                    {test.name}
                </label>
                <div className="test-item-result">
                    {result.status === 'pending' && (
                        <span className="test-result-status pending">─</span>
                    )}
                    {result.status === 'running' && (
                        <span className="test-result-status running">
                            <span className="test-spinner" />
                            実行中...
                        </span>
                    )}
                    {result.status === 'pass' && (
                        <>
                            <span className="test-result-status pass">
                                <CheckIcon /> {result.skipped ? 'SKIP' : 'PASS'}
                            </span>
                            {result.time && <span className="test-result-time">{result.time}ms</span>}
                        </>
                    )}
                    {result.status === 'fail' && (
                        <>
                            <span className="test-result-status fail">
                                <XIcon /> FAIL
                            </span>
                            {result.time && <span className="test-result-time">{result.time}ms</span>}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="test-panel-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isRunning) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        className={`test-panel-modal ${isRunning ? 'running' : ''}`}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={springTransition}
                    >
                        {/* ヘッダー */}
                        <div className="test-panel-header">
                            <h2 className="test-panel-title">
                                🧪 自動テスト
                            </h2>
                            <button
                                className="test-panel-close"
                                onClick={onClose}
                                disabled={isRunning}
                                aria-label="閉じる"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* モード表示 */}
                        <div className="test-panel-mode-badge">
                            📍 現在のモード: <span className="test-panel-mode-value">{mockMode}</span>
                        </div>

                        {/* コンテンツ */}
                        <div className="test-panel-content">
                            {/* 基本テストセクション */}
                            <div className="test-section">
                                <div className="test-section-header">
                                    <span className="test-section-title">
                                        {TEST_CATEGORIES.basic.icon} {TEST_CATEGORIES.basic.name}
                                    </span>
                                    <span className="test-section-badge">
                                        {TEST_CATEGORIES.basic.description}
                                    </span>
                                </div>
                                {basicTests.map(test => renderTestItem(test))}
                            </div>

                            {/* APIテストセクション */}
                            <div className={`test-section ${!isApiTestsEnabled ? 'disabled' : ''}`}>
                                <div className="test-section-header">
                                    <span className="test-section-title">
                                        {TEST_CATEGORIES.api.icon} {TEST_CATEGORIES.api.name}
                                    </span>
                                    <span className="test-section-badge">
                                        {!isApiTestsEnabled ? '🔒 無効' : TEST_CATEGORIES.api.description}
                                    </span>
                                </div>
                                {apiTests.map(test => renderTestItem(test, !isApiTestsEnabled))}
                            </div>
                        </div>

                        {/* フッター */}
                        <div className="test-panel-footer">
                            <div className="test-panel-actions">
                                <button
                                    className="test-panel-btn primary"
                                    onClick={runAllTests}
                                    disabled={isRunning}
                                >
                                    {isRunning ? (
                                        <>
                                            <span className="test-spinner" />
                                            実行中...
                                        </>
                                    ) : (
                                        <>🚀 全テスト実行</>
                                    )}
                                </button>
                                <button
                                    className="test-panel-btn secondary"
                                    onClick={copyResults}
                                    disabled={isRunning}
                                >
                                    📋 結果をコピー
                                </button>
                            </div>

                            <div className="test-panel-summary">
                                <span className="test-panel-summary-item">
                                    📊 結果: {summary.completed}/{summary.total} 完了
                                </span>
                                <span className="test-panel-summary-item success">
                                    ✅ {summary.passed} 成功
                                </span>
                                <span className="test-panel-summary-item fail">
                                    ❌ {summary.failed} 失敗
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TestPanel;
