/**
 * Message Serializer Utility
 * 
 * Handles the conversion between UI state and the JSON Structured Message Protocol.
 * Ensures backward compatibility with legacy plain text messages.
 */

import { StructuredUserMessage, AttachmentMeta, IntelligenceContext, KnowledgeContext } from '../types/messageProtocol';

const PROTOCOL_VERSION = "1.0";

/**
 * Builds a structured message object (as a JSON string) from individual components.
 * 
 * @param text The user's input text
 * @param attachments List of attached files
 * @param intelligence Settings for the AI model/mode
 * @param context context settings like Knowledge Base selection
 * @returns Serialized JSON string ready for the API
 */
export const buildStructuredMessage = (
    text: string,
    attachments: AttachmentMeta[] = [],
    intelligence: IntelligenceContext = { mode: 'speed' },
    context: KnowledgeContext = { selected_store_ids: [] }
): string => {
    const message: StructuredUserMessage = {
        v: PROTOCOL_VERSION,
        content: {
            text: text
        },
        attachments: attachments,
        intelligence: intelligence,
        context: context,
        timestamp: Date.now()
    };

    return JSON.stringify(message);
};

/**
 * Safely parses a message string.
 * If the string is valid JSON adhering to the protocol, it returns the structured object.
 * If it's a plain text string (legacy) or invalid JSON, it wraps it in a compatible structure.
 * 
 * @param query The raw query string from the API/History
 * @returns A guaranteed StructuredUserMessage object
 */
export const parseStructuredMessage = (query: string): StructuredUserMessage => {
    if (!query) {
        return createFallbackMessage("");
    }

    try {
        const parsed = JSON.parse(query);

        // Basic validation to check if it matches our protocol
        // We check for 'v' and 'content' as minimal markers
        if (parsed && typeof parsed === 'object' && parsed.v && parsed.content) {
            return parsed as StructuredUserMessage;
        }

        // It was JSON, but not our protocol (unlikely in this specifics, but possible)
        // Treat as text
        return createFallbackMessage(query);

    } catch (e) {
        // Not JSON, likely plain text (Legacy message)
        return createFallbackMessage(query);
    }
};

/**
 * Helper to create a fallback structured message from a plain string.
 */
const createFallbackMessage = (text: string): StructuredUserMessage => {
    return {
        v: "0.0", // version 0 denotes legacy
        content: { text: text },
        attachments: [],
        intelligence: { mode: 'speed' }, // Default assumption
        context: { selected_store_ids: [] },
        timestamp: 0 // Unknown
    };
};

export const isStructuredMessage = (obj: any): obj is StructuredUserMessage => {
    return obj && typeof obj === 'object' && 'v' in obj && 'content' in obj;
};

/**
 * Restores the full state from a structured message string.
 * Used for Editing or Retrying messages.
 * 
 * @param query The raw query string
 * @returns Object containing all components of the message
 */
export const restoreMessageState = (query: string) => {
    const parsed = parseStructuredMessage(query);
    return {
        text: parsed.content.text,
        attachments: parsed.attachments || [],
        intelligence: parsed.intelligence,
        context: parsed.context,
        timestamp: parsed.timestamp
    };
};
