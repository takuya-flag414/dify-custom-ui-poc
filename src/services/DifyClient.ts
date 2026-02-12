/**
 * Dify Client Service
 * Handles interactions with Dify API (or Backend B) that are not covered by ChatServiceAdapter.
 * Specifically used for fetching Knowledge Stores (Gemini File Search Stores).
 */

export interface KnowledgeStore {
    id: string;
    display_name: string;
    description?: string;
}

/**
 * Fetch available Knowledge Stores (e.g., from Backend B or Dify Knowledge API)
 * @param apiUrl - API Base URL
 * @param apiKey - API Key
 * @returns List of KnowledgeStore
 */
export const fetchKnowledgeStores = async (apiUrl: string, apiKey: string): Promise<KnowledgeStore[]> => {
    // If no API URL is provided, return empty list (or mock data if needed)
    if (!apiUrl) {
        // console.warn("fetchKnowledgeStores: No API URL provided.");
        return [];
    }

    try {
        // Hypothetical endpoint for fetching knowledge bases/stores
        // Adjust this endpoint based on actual Backend B implementation
        const response = await fetch(`${apiUrl}/knowledge-bases`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`fetchKnowledgeStores: API returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.data || data; // Handle { data: [...] } or [...]
    } catch (error) {
        console.error("fetchKnowledgeStores: Network or Parsing Error", error);
        return [];
    }
};
