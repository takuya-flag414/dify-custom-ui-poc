// src/components/Message/ContextChips.tsx
import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MOCK_STORES } from '../../mocks/storeData';
import { useBackendBConfig } from '../../hooks/useBackendBConfig';
import { useGeminiStores } from '../../hooks/useGeminiStores';
import './ContextChips.css';
import FileIcon from '../Shared/FileIcon';
import { parseStructuredMessage } from '../../utils/messageSerializer';

// Spring Physics (DESIGN_RULE準拠)
const SPRING_CONFIG = {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 1
};

// Container animation
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

// Chip animation
const chipVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 5 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: SPRING_CONFIG
    }
};

// Icons
const StoreIcon = () => (
    <svg className="context-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const DomainIcon = () => (
    <svg className="context-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

const WebSearchIcon = () => (
    <svg className="context-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

interface ContextChipsProps {
    message: {
        text?: string;
        files?: Array<{ name: string; type?: string }>;
    };
    previousMessage?: {
        text?: string;
        files?: Array<{ name: string; type?: string }>;
    } | null;
}

const ContextChips: React.FC<ContextChipsProps> = ({ message, previousMessage }) => {
    const { text, files } = message;

    // Phase B: Backend B Config & Real Store Data
    const { apiKey: backendBApiKey, apiUrl: backendBApiUrl } = useBackendBConfig();
    // mockMode is not directly available here, so we default to 'OFF' to attempt real fetch if key exists
    // (If key is missing, useGeminiStores will skip fetching anyway)
    const { stores: realStores, refetch: refetchStores } = useGeminiStores('OFF', backendBApiKey, backendBApiUrl);

    // Parse structured message to extract context
    const parsedMessage = useMemo(() => {
        if (!text) return null;
        const parsed = parseStructuredMessage(text);
        if (parsed.v === "0.0") return null;
        return parsed;
    }, [text]);

    // Parse PREVIOUS message to extract context for diffing
    const previousParsedMessage = useMemo(() => {
        if (!previousMessage?.text) return null;
        const parsed = parseStructuredMessage(previousMessage.text);
        if (parsed.v === "0.0") return null;
        return parsed;
    }, [previousMessage?.text]);

    const parsedContext = parsedMessage?.context;
    const previousContext = previousParsedMessage?.context;

    const structuredAttachments = parsedMessage?.attachments || [];
    const previousStructuredAttachments = previousParsedMessage?.attachments || [];

    // Effect: If we have store IDs but no names, try refetching real stores
    useEffect(() => {
        if (parsedContext?.selected_store_ids?.length > 0 && backendBApiKey) {
            // Simple check: if we have IDs but realStores is empty (and we have an API key), try fetching
            if (realStores.length === 0) {
                refetchStores();
            }
        }
    }, [parsedContext?.selected_store_ids, backendBApiKey, realStores.length, refetchStores]);

    // Effect: If we have store IDs but no names, try refetching real stores
    useEffect(() => {
        if (parsedContext?.selected_store_ids?.length > 0 && backendBApiKey) {
            // Simple check: if we have IDs but realStores is empty (and we have an API key), try fetching
            if (realStores.length === 0) {
                refetchStores();
            }
        }
    }, [parsedContext?.selected_store_ids, backendBApiKey, realStores.length, refetchStores]);

    // Build chips list
    const chips = useMemo(() => {
        const list: Array<{
            type: string;
            label: string;
            icon: React.ReactNode;
            title?: string;
        }> = [];

        // Debug Logs
        // console.log('[ContextChips] Current Context:', parsedContext);
        // console.log('[ContextChips] Previous Context:', previousContext);

        // Knowledge Store (Diffing)
        if (parsedContext?.selected_store_ids?.length > 0) {
            const currentStoreIds = parsedContext.selected_store_ids;
            const previousStoreIds = previousContext?.selected_store_ids || [];

            currentStoreIds.forEach((storeId: string) => {
                // Skip if this store ID was present in the previous message's context
                if (previousStoreIds.includes(storeId)) {
                    return;
                }

                // 1. Try MOCK_STORES first (for FE mode or basic mocks)
                let storeName = MOCK_STORES.find(s => s.id === storeId)?.display_name;

                // 2. If not found, try Real Stores (fetched from API)
                if (!storeName) {
                    storeName = realStores.find(s => s.id === storeId)?.display_name;
                }

                // 3. Fallback to ID
                const label = storeName || storeId;

                list.push({
                    type: 'store',
                    label: label,
                    icon: <StoreIcon />,
                    title: `選択したストア: ${label} (${storeId})`
                });
            });
        }

        // Domain Filter (Individual Chips) (Diffing)
        if (parsedContext?.domain_filter?.length > 0) {
            const currentDomains = parsedContext.domain_filter;
            const previousDomains = previousContext?.domain_filter || [];

            currentDomains.forEach((domain: string) => {
                // Skip if this domain was present in the previous message's context
                if (previousDomains.includes(domain)) {
                    return;
                }

                list.push({
                    type: 'domain',
                    label: domain,
                    icon: <DomainIcon />,
                    title: `ドメインフィルター: ${domain}`
                });
            });
        }

        // REMOVED: Web Search Chip (as requested)

        // Attachments from structured message (Diffing)
        structuredAttachments.forEach((file: { name: string }) => {
            // Check if file with same name existed in previous attachments
            const existed = previousStructuredAttachments.some((prevFile: { name: string }) => prevFile.name === file.name);
            if (existed) return;

            list.push({
                type: 'file',
                label: file.name,
                // @ts-expect-error FileIcon is a .jsx component without proper TS types
                icon: <FileIcon filename={file.name} />,
                title: file.name
            });
        });

        // Attachments from files prop (fallback) (Diffing)
        // Only process if no structured attachments in current message
        if (files && files.length > 0 && structuredAttachments.length === 0) {
            const previousFiles = previousMessage?.files || [];

            files.forEach((file) => {
                // Check if file with same name existed in previous message's files prop
                const existed = previousFiles.some((prevFile) => prevFile.name === file.name);
                if (existed) return;

                list.push({
                    type: 'file',
                    label: file.name,
                    // @ts-expect-error FileIcon is a .jsx component without proper TS types
                    icon: <FileIcon filename={file.name} />,
                    title: file.name
                });
            });
        }

        return list;
    }, [parsedContext, structuredAttachments, files, realStores, previousContext, previousStructuredAttachments, previousMessage?.files]);

    // Don't render if no chips
    if (chips.length === 0) return null;

    return (
        <motion.div
            className="context-chips-container"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {chips.map((chip, idx) => (
                <motion.span
                    key={`${chip.type}-${idx}`}
                    className={`context-chip context-chip-${chip.type}`}
                    variants={chipVariants}
                    title={chip.title}
                >
                    {chip.icon}
                    <span className="context-chip-label">{chip.label}</span>
                </motion.span>
            ))}
        </motion.div>
    );
};

export default ContextChips;
