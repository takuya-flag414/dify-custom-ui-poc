// src/hooks/chat/perfTracker.js
// useChat.js から分離したパフォーマンス計測用トラッカー

/**
 * パフォーマンス計測用トラッカーを作成
 * @param {function} addLog - ログ出力関数
 * @returns {object} パフォーマンストラッカーオブジェクト
 */
export const createPerfTracker = (addLog) => ({
  start: 0,
  firstByte: 0,
  firstToken: 0,
  end: 0,
  charCount: 0,
  steps: [],
  activeNodes: {},

  markStart() { this.start = performance.now(); },
  markFirstByte() { if (!this.firstByte) this.firstByte = performance.now(); },
  markNodeStart(nodeId, title) { this.activeNodes[nodeId] = { title, start: performance.now() }; },
  markNodeEnd(nodeId) {
    const node = this.activeNodes[nodeId];
    if (node) {
      this.steps.push({ name: node.title, duration: performance.now() - node.start });
      delete this.activeNodes[nodeId];
    }
  },
  markFirstToken() { if (!this.firstToken) this.firstToken = performance.now(); },
  incrementChars(text) { this.charCount += (text ? text.length : 0); },
  markEnd() { this.end = performance.now(); },

  logReport(query) {
    // 開発者ツール向けログ
    const now = performance.now();
    const endTime = this.end || now;
    const totalTime = endTime - this.start;
    const ttfb = this.firstByte ? this.firstByte - this.start : 0;
    const ttft = this.firstToken ? this.firstToken - this.start : 0;
    const thinkingTotal = this.steps.reduce((sum, s) => sum + s.duration, 0);
    const displayDuration = this.firstToken ? (endTime - this.firstToken) : 0;
    const cps = displayDuration > 0 ? (this.charCount / (displayDuration / 1000)) : 0;

    console.groupCollapsed(`🚀 [Perf] Message Cycle: "${query.length > 20 ? query.substring(0, 20) + '...' : query}"`);
    console.log(`⏱️ Total Cycle: ${totalTime.toFixed(2)}ms`);
    console.log(`📡 TTFB (Network+Upload): ${ttfb.toFixed(2)}ms`);
    console.log(`👀 TTFT (Wait for Text): ${ttft.toFixed(2)}ms`);
    if (this.steps.length > 0) {
      console.log(`🧠 Thinking Process (Total: ${thinkingTotal.toFixed(2)}ms)`);
      console.table(this.steps.map(s => ({ Step: s.name, Time: `${s.duration.toFixed(2)}ms` })));
    }
    if (this.firstToken) {
      console.log(`📺 Display Duration: ${displayDuration.toFixed(2)}ms`);
      console.log(`⚡ Throughput: ${cps.toFixed(1)} chars/sec (Total: ${this.charCount} chars)`);
    }
    console.groupEnd();

    // アプリ内ログ出力
    if (addLog) {
      const shortQuery = query.length > 15 ? query.substring(0, 15) + '...' : query;
      let logText = `[Perf] Cycle: "${shortQuery}" | Total: ${totalTime.toFixed(0)}ms | TTFB: ${ttfb.toFixed(0)}ms | TTFT: ${ttft.toFixed(0)}ms`;
      if (this.steps.length > 0) {
        logText += ` | Thinking: ${thinkingTotal.toFixed(0)}ms (${this.steps.length} steps)`;
      }
      addLog(logText, 'info');
    }
  }
});
