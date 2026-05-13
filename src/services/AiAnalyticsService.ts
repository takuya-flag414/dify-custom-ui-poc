// src/services/AiAnalyticsService.ts
import { db } from '../lib/firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    Timestamp,
    serverTimestamp 
} from 'firebase/firestore';

/**
 * AI利用ログのインターフェース
 */
export interface AiUsageLog {
    timestamp: any;
    user_id: string;
    email: string;
    conversation_id: string;
    model: string;
    architecture: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    latency_ms: number;
    ttft_ms: number;
    estimated_cost_jpy: number;
    usd_jpy_rate: number;
}

/**
 * AI利用分析サービス
 * トークン使用量、コスト、レイテンシなどの統計情報を管理します。
 */
class AiAnalyticsService {
    private cachedRate: number | null = null;
    private lastFetchTime: number = 0;
    private readonly CACHE_DURATION = 1000 * 60 * 60; // 1時間キャッシュ

    /**
     * 最新のUSD/JPY為替レートを取得する（外部API利用）
     */
    async fetchExchangeRate(): Promise<number> {
        const now = Date.now();
        // 1時間以内ならキャッシュを返す
        if (this.cachedRate && (now - this.lastFetchTime < this.CACHE_DURATION)) {
            return this.cachedRate;
        }

        try {
            // 無料の為替APIを利用
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            if (data && data.rates && data.rates.JPY) {
                this.cachedRate = data.rates.JPY;
                this.lastFetchTime = now;
                console.log(`[AiAnalyticsService] Exchange rate updated: 1 USD = ${this.cachedRate} JPY`);
                return this.cachedRate;
            }
        } catch (error) {
            console.error('[AiAnalyticsService] Failed to fetch exchange rate:', error);
        }

        // 取得失敗時は固定レート（150円）または前回のキャッシュを返す
        return this.cachedRate || 150;
    }

    /**
     * AI利用ログを記録する
     * ※対話内容は含めず、メタデータのみを記録します
     */
    async logAiUsage(data: {
        user_id: string;
        email: string;
        conversation_id: string;
        model: string;
        architecture: string;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        latency_ms: number;
        ttft_ms: number;
        total_price_usd?: number; // Difyから渡されるコスト(USD)
    }) {
        try {
            const rate = await this.fetchExchangeRate();
            
            // Difyからコスト(USD)が来ている場合はそれを使用（文字列の場合があるためNumberでキャスト）
            const totalPriceUsd = Number(data.total_price_usd) || 0;
            // 日本円換算（小数点第2位まで）
            const estimatedCostJpy = Math.round(totalPriceUsd * rate * 100) / 100;

            const logData: AiUsageLog = {
                timestamp: serverTimestamp(),
                user_id: data.user_id,
                email: data.email,
                conversation_id: data.conversation_id,
                model: data.model,
                architecture: data.architecture,
                prompt_tokens: data.prompt_tokens,
                completion_tokens: data.completion_tokens,
                total_tokens: data.total_tokens,
                latency_ms: data.latency_ms,
                ttft_ms: data.ttft_ms,
                estimated_cost_jpy: estimatedCostJpy,
                usd_jpy_rate: rate
            };

            // Firestoreに保存
            await addDoc(collection(db, 'ai_usage_logs'), logData);
            console.log('[AiAnalyticsService] AI usage logged successfully');
        } catch (error) {
            console.error('[AiAnalyticsService] Failed to log AI usage:', error);
        }
    }

    /**
     * 分析用統計データを取得する（管理者用）
     * @param days 取得対象期間（日数）
     */
    async getAiUsageStats(days: number = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const q = query(
                collection(db, 'ai_usage_logs'),
                where('timestamp', '>=', Timestamp.fromDate(cutoffDate)),
                orderBy('timestamp', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Timestamp型をJavaScriptのDateオブジェクトに変換
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
                };
            });
            
            return logs;
        } catch (error) {
            console.error('[AiAnalyticsService] Failed to fetch AI usage stats:', error);
            return [];
        }
    }
}

export const aiAnalyticsService = new AiAnalyticsService();
