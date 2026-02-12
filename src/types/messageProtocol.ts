/**
 * Structured User Message Protocol Definition
 * 
 * This file defines the shape of the JSON payload sent as the user's message.
 * It encapsulates not just the text, but the entire context of the user's intent,
 * including attachments, mode settings, and reasoning parameters.
 */

// Since this is a .ts file, we define interfaces directly.

/**
 * Metadata for a file attached to the message.
 */
export interface AttachmentMeta {
    id: string;
    name: string;
    type: string; // MIME type e.g., 'image/png', 'application/pdf'
    size?: number;
    url?: string; // Optional if it's a remote file
    extension?: string;
}

/**
 * Intelligence settings for the message generation.
 */
export interface IntelligenceContext {
    mode: 'speed' | 'deep-think'; // Corresponds to the UI toggle
    reasoning_effort?: 'low' | 'medium' | 'high'; // For reasoning models
    model?: string; // Specific model override if applicable
}

/**
 * Knowledge Base / RAG context used for this message.
 */
export interface KnowledgeContext {
    selected_store_ids: string[]; // IDs of Dify Knowledge sets
    domain_context?: string;      // 'auto', 'general', 'coding', etc.
    web_search_enabled?: boolean;
    domain_filter?: string[];     // List of specific domains to restrict search to
}

/**
 * The core content of the user's message.
 */
export interface MessageContent {
    text: string;
}

/**
 * The root object serialized into the `query` field.
 */
export interface StructuredUserMessage {
    v: string; // Protocol version, e.g., "1.0"
    content: MessageContent;
    attachments: AttachmentMeta[];
    intelligence: IntelligenceContext;
    context: KnowledgeContext;

    // Optional metadata for restoration
    timestamp: number;
    uiState?: {
        // Arbitrary UI state to restore exact view
        [key: string]: any;
    };
}
