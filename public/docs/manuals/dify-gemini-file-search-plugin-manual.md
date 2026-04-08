# gemini_file_search

**Author:** r3-yamauchi
**Version:** 0.0.1
**Type:** tool

English | [Japanese](https://github.com/r3-yamauchi/dify-gemini-file-search-plugin/blob/main/readme/README_ja_JP.md)

## Description

`gemini_file_search` brings Google's Gemini File Search capabilities to your Dify workflows. This plugin provides nine focused tools for managing file search stores and performing semantic search with RAG (Retrieval-Augmented Generation):

- **Store Management**: Create, list, view, and delete file search stores
- **Document Ingestion**: Upload files with automatic chunking and embedding
- **Document Visibility & Hygiene**: List, inspect, and remove the files that live inside a store
- **Semantic Search**: Query indexed documents with AI-generated answers and citations

The source code of this plugin is available in the [GitHub repository](https://github.com/r3-yamauchi/dify-gemini-file-search-plugin).

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/r3-yamauchi/dify-gemini-file-search-plugin)

## Features

### Tier 1: Core RAG Functionality
- **Create Store** (`create_store`): Initialize new file search stores with optional display names
- **Upload File** (`upload_file`): Upload and import files directly with automatic chunking, embedding, and indexing
- **Search** (`search`): Perform semantic search across indexed documents with AI-generated answers and citations

### Tier 2: Store Management
- **List Stores** (`list_stores`): View all file search stores in your project
- **Get Store Details** (`get_store`): Inspect specific store properties and metadata
- **Delete Store** (`delete_store`): Remove stores and their data permanently

### Tier 3: Document Visibility
- **List Files** (`list_files`): Enumerate the documents stored in a given file search store with paging controls
- **Get File Details** (`get_file`): Retrieve metadata, ingestion state, and timestamps for a single document
- **Delete File** (`delete_file`): Remove individual documents without touching the rest of the store

### Key Capabilities
- **Automatic Chunking**: Files are automatically split into optimal chunks for embedding
- **Custom Metadata**: Tag documents with searchable metadata (author, date, category, etc.)
- **Metadata Filtering**: Search within document subsets using filter expressions
- **Citation Support**: AI answers include references to source documents
- **Configurable Chunking**: Customize token limits and overlap for fine-grained control
- **Multi-Model Support**: Works with gemini-2.5-flash and gemini-2.5-pro
- **Synchronous Operation**: All long-running operations poll automatically until completion

## Prerequisites

- Dify SaaS or self-hosted instance with plugin support enabled
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Supported file formats: PDF, TXT, DOCX, Markdown, code files, and many more

## Installation & Setup

1. **Install the plugin** from the Dify Marketplace or upload this package manually
2. **Configure provider credentials**:
   - **Gemini API Key** (required): Your API key from Google AI Studio
   - **Default Model** (optional): Defaults to `gemini-2.5-flash`
3. **Add tool nodes** to your workflow and configure parameters as described below

## Tool Parameters

### 1. Create File Search Store (`create_store`)

Creates a new file search store for storing document embeddings.

| Parameter | Required | Description |
| --- | --- | --- |
| `display_name` | ❌ | Optional human-readable name for the store |

**Returns**: Store name (e.g., `fileSearchStores/abc123`), display name, creation timestamp

---

### 2. Upload File (`upload_file`)

Upload and import a file with automatic chunking and indexing.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Target store name (e.g., `fileSearchStores/abc123`) |
| `file` | ✅ | File to upload (PDF, TXT, DOCX, Markdown, etc.) |
| `display_name` | ✅ | Unique name for citations (visible in search results) |
| `custom_metadata` | ❌ | Metadata as JSON array **or** direct list/dict (e.g., `[{"key":"author","string_value":"John Doe"}]`) |
| `max_tokens_per_chunk` | ❌ | Maximum tokens per chunk (custom chunking) |
| `max_overlap_tokens` | ❌ | Overlapping tokens between chunks (custom chunking) |

**Returns**: Operation status, store name, display name, completion details, and `file_id` (document resource name) for downstream tools

**Example metadata** (can be provided as JSON text or list objects):
```json
[
  {"key": "author", "string_value": "Robert Graves"},
  {"key": "year", "numeric_value": 1934},
  {"key": "category", "string_value": "historical-fiction"}
]
```

> **Note:** Gemini File Search currently enforces a 100 MB per-file limit. The upload tool validates this locally and will raise an error before calling the API if a file exceeds the limit.

---

### 3. Search (`search`)

Perform semantic search with AI-generated answers.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Store to search (e.g., `fileSearchStores/abc123`) |
| `query` | ✅ | Search query or question |
| `model` | ❌ | Model override (defaults to provider setting) |
| `metadata_filter` | ❌ | Filter expression (e.g., `author="Robert Graves"`) |
| `include_citations` | ❌ | Include citation information (default: `false`) |

**Returns**: AI-generated answer, citations with source references, grounding metadata

**Example filter syntax**:
- `author="John Doe"` - Exact match
- `year=2024` - Numeric match
- `category="fiction" AND year>2020` - Combined filters

---

### 4. List Stores (`list_stores`)

List all file search stores in your project.

**No parameters required**

**Returns**: Array of stores with names, display names, and creation timestamps

---

### 5. Get Store Details (`get_store`)

Get detailed information about a specific store.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Store name to retrieve |

**Returns**: Store name, display name, creation time, update time

---

### 6. Delete Store (`delete_store`)

Delete a file search store and all its data permanently.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Store name to delete |
| `force` | ❌ | Force deletion even if store contains documents (default: `false`) |

**Returns**: Deletion status

---

### 7. List Files (`list_files`)

List the documents that currently reside in a specific file search store.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Store that owns the documents (e.g., `fileSearchStores/abc123`) |
| `page_size` | ❌ | Optional page size between 1 and 100. Defaults to the API setting. |
| `page_token` | ❌ | Pass the `next_page_token` from a previous response to continue listing. |

**Returns**: Array of document metadata (name, display name, state, size, timestamps), count, and `next_page_token` for pagination

---

### 8. Get File Details (`get_file`)

Retrieve metadata and ingestion status for a single document.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Store containing the document |
| `document_name` | ❌ | Full document resource name as returned by `list_files` |
| `document_id` | ❌ | Document identifier when you do not have the full resource name (with or without the `documents/` prefix) |

> **Note:** Provide either `document_name` *or* `document_id`. If both are supplied, `document_name` takes precedence.

**Returns**: Document metadata including ingestion state, file size, timestamps, and custom metadata

---

### 9. Delete File (`delete_file`)

Delete one document inside a store without removing the entire store.

| Parameter | Required | Description |
| --- | --- | --- |
| `file_search_store_name` | ✅ | Store containing the document |
| `document_name` | ❌ | Full document resource name (preferred). Overrides `document_id` when supplied. |
| `document_id` | ❌ | Document identifier when you do not have the full resource name |
| `confirm` | ✅ | Must be set to `true` to prevent accidental deletions |
| `force` | ❌ | Force deletion even if the document is in use |

**Returns**: Deletion status with store name, document name, and whether force mode was used

---

## Workflow Examples

### Example 1: Document Upload and Search

```yaml
nodes:
  - type: tool
    name: create_my_store
    tool: create_store
    parameters:
      display_name: "Product Documentation"

  - type: tool
    name: upload_manual
    tool: upload_file
    parameters:
      file_search_store_name: "{{create_my_store.store_name}}"
      file: "{{pdf_input}}"
      display_name: "User Manual v2.0"
      custom_metadata: '[{"key":"version","string_value":"2.0"},{"key":"type","string_value":"manual"}]'

  - type: tool
    name: search_docs
    tool: search
    parameters:
      file_search_store_name: "{{create_my_store.store_name}}"
      query: "How do I reset my password?"
      include_citations: false
```

### Example 2: Filtered Search with Metadata

```yaml
nodes:
  - type: tool
    name: search_filtered
    tool: search
    parameters:
      file_search_store_name: "fileSearchStores/my-kb-123"
      query: "What are the latest features?"
      metadata_filter: 'version="2.0" AND type="manual"'
```

### Example 3: Store Management

```yaml
nodes:
  - type: tool
    name: list_all_stores
    tool: list_stores

  - type: tool
    name: get_specific_store
    tool: get_store
    parameters:
      file_search_store_name: "fileSearchStores/abc123"

  - type: tool
    name: cleanup_old_store
    tool: delete_store
    parameters:
      file_search_store_name: "fileSearchStores/old-store-456"
      force: true
```

---

## Supported File Formats

Gemini File Search supports a wide range of file formats including:

- **Documents**: PDF, DOCX, ODT, TXT, Markdown, RTF
- **Spreadsheets**: XLSX, CSV, TSV
- **Presentations**: PPTX
- **Code**: Python, JavaScript, Java, C++, Go, Rust, and many more
- **Data**: JSON, XML, YAML, SQL

See the [Gemini API documentation](https://ai.google.dev/gemini-api/docs/file-search?hl=ja) for the complete list.

---

## Rate Limits & Quotas

- **Max file size**: 100 MB per document
- **Stores per project**: 10
- **Total storage** (tier-dependent):
  - Free: 1 GB
  - Tier 1: 10 GB
  - Tier 2: 100 GB
  - Tier 3: 1 TB
- **Recommended store size**: < 20 GB per store for optimal retrieval latency

---

## Pricing

- **Indexing**: $0.15 per million tokens (based on [embedding pricing](https://ai.google.dev/gemini-api/docs/pricing?hl=ja#gemini-embedding))
- **Storage**: Free
- **Query-time embeddings**: Free
- **Retrieved document tokens**: Charged as normal [context tokens](https://ai.google.dev/gemini-api/docs/tokens?hl=ja)

---

## Troubleshooting

| Error | Solution |
| --- | --- |
| **API key invalid** | Verify your Gemini API key in provider settings |
| **Quota exceeded** | Check your API usage limits and upgrade tier if needed |
| **Store not found** | Confirm the store name exists using `list_stores` |
| **File upload timeout** | Large files may take time; operation polling handles this automatically |
| **Metadata filter syntax error** | Use correct syntax: `key="value"` for strings, `key=123` for numbers |

---

## Privacy Policy

See [PRIVACY.md](PRIVACY.md) for detailed information about data handling and security.

### Data Handling

This plugin processes:
1. **Files**: Uploaded documents are sent to Gemini API for chunking and embedding
2. **API Credentials**: Gemini API key is stored securely in plugin settings
3. **Store IDs**: File search store names are used to organize embeddings

### Storage

- Uploaded files (via Files API) are deleted after 48 hours
- File search store data persists until manually deleted
- No data is stored locally by the plugin

### Security

- All API communications use HTTPS encryption
- API keys are stored securely by Dify's credential management system

---

## License

This project is released under the [MIT License](LICENSE).
