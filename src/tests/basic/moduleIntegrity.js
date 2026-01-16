// src/tests/basic/moduleIntegrity.js
// リファクタリング後のモジュール整合性テスト

export const moduleIntegrityTest = {
  id: 'module-integrity',
  name: 'モジュール整合性',
  category: 'basic',
  description: 'chat/配下の分離モジュールが正常に読み込めるか',
  
  async run(context) {
    const { addLog } = context;
    const errors = [];
    const modules = [
      { name: 'constants', path: '../../hooks/chat/constants' },
      { name: 'perfTracker', path: '../../hooks/chat/perfTracker' },
      { name: 'historyLoader', path: '../../hooks/chat/historyLoader' },
      { name: 'nodeEventHandlers', path: '../../hooks/chat/nodeEventHandlers' },
      { name: 'messageEventHandlers', path: '../../hooks/chat/messageEventHandlers' },
      { name: 'messageActions', path: '../../hooks/chat/messageActions' },
    ];
    
    addLog?.('[Test:ModuleIntegrity] 開始', 'info');
    
    for (const mod of modules) {
      try {
        // 動的インポートでモジュールを読み込み
        const imported = await import(/* @vite-ignore */ mod.path);
        
        // エクスポートがあるか確認
        if (Object.keys(imported).length === 0) {
          throw new Error(`${mod.name}: エクスポートが空です`);
        }
        
        addLog?.(`[Test:ModuleIntegrity] ✅ ${mod.name}: OK`, 'info');
      } catch (e) {
        errors.push(`${mod.name}: ${e.message}`);
        addLog?.(`[Test:ModuleIntegrity] ❌ ${mod.name}: ${e.message}`, 'error');
      }
    }
    
    if (errors.length > 0) {
      return {
        success: false,
        message: `${errors.length}モジュールでエラー`,
        details: errors,
      };
    }
    
    return {
      success: true,
      message: `${modules.length}モジュール正常読み込み`,
    };
  },
};
