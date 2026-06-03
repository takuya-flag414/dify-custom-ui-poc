import { CREDIT_RATE_USD, DEFAULT_FALLBACK_CREDIT } from '../contexts/CreditContext';

interface NodeData {
  node_type?: string;
  outputs?: any;
  execution_metadata?: {
    total_price?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * ストリーミングの node_finished イベントのデータから消費クレジットを計算する
 * @param nodeData node_finished イベントの data ペイロード
 * @returns 計算された消費クレジット (整数)
 */
export const calculateNodeCredit = (nodeData: NodeData): number => {
  if (!nodeData) return 0;

  // ★追加: クレジット消費対象ノードタイプの限定
  // (LLM、HTTPリクエスト、外部ツールのみ対象とし、条件分岐等は0とする)
  const TARGET_NODE_TYPES = ['llm', 'http-request', 'tool'];
  if (nodeData.node_type && !TARGET_NODE_TYPES.includes(nodeData.node_type)) {
    return 0;
  }

  // 1. LLMノード: execution_metadata.total_price を確認
  if (nodeData.execution_metadata && typeof nodeData.execution_metadata.total_price === 'number' && nodeData.execution_metadata.total_price > 0) {
    return Math.ceil(nodeData.execution_metadata.total_price * CREDIT_RATE_USD);
  }

  // 2. LLMノード: outputs.usage.total_price を確認
  if (nodeData.outputs && nodeData.outputs.usage && typeof nodeData.outputs.usage.total_price === 'number' && nodeData.outputs.usage.total_price > 0) {
    return Math.ceil(nodeData.outputs.usage.total_price * CREDIT_RATE_USD);
  }
  
  if (nodeData.outputs && nodeData.outputs.usage && typeof nodeData.outputs.usage.total_price === 'string') {
    const price = parseFloat(nodeData.outputs.usage.total_price);
    if (!isNaN(price) && price > 0) {
      return Math.ceil(price * CREDIT_RATE_USD);
    }
  }

  // 3. Perplexity等の外部ツール: outputs.body 内の usage.cost.total_cost を確認
  if (nodeData.outputs && nodeData.outputs.body) {
    try {
      const bodyStr = typeof nodeData.outputs.body === 'string' ? nodeData.outputs.body : JSON.stringify(nodeData.outputs.body);
      const bodyJson = JSON.parse(bodyStr);
      if (bodyJson.usage && bodyJson.usage.cost && typeof bodyJson.usage.cost.total_cost === 'number' && bodyJson.usage.cost.total_cost > 0) {
        return Math.ceil(bodyJson.usage.cost.total_cost * CREDIT_RATE_USD);
      }
    } catch (e) {
      console.warn('Failed to parse body JSON for cost calculation', e);
    }
  }

  // 4. フォールバック: コスト情報がない場合は固定クレジットを加算
  return DEFAULT_FALLBACK_CREDIT;
};
