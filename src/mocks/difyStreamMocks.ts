export const mockLlmNodeFinishedEvent = {
  event: "node_finished",
  task_id: "task-123",
  workflow_run_id: "run-456",
  data: {
    id: "node-llm-1",
    node_id: "llm_node",
    node_type: "llm",
    title: "Intent Analyzer",
    status: "succeeded",
    execution_metadata: {
      total_tokens: 5109,
      total_price: 0.000789,
      currency: "USD"
    },
    outputs: {
      text: "LLM response text",
      usage: {
        total_price: "0.000789"
      }
    }
  }
};

export const mockPerplexityNodeFinishedEvent = {
  event: "node_finished",
  task_id: "task-123",
  workflow_run_id: "run-456",
  data: {
    id: "node-tool-1",
    node_id: "perplexity_node",
    node_type: "tool",
    title: "Perplexity Search",
    status: "succeeded",
    outputs: {
      status_code: 200,
      body: JSON.stringify({
        usage: {
          cost: {
            total_cost: 0.00655
          }
        }
      })
    }
  }
};

export const mockRagNodeFinishedEvent = {
  event: "node_finished",
  task_id: "task-123",
  workflow_run_id: "run-456",
  data: {
    id: "node-tool-2",
    node_id: "rag_node",
    node_type: "tool",
    title: "Document Retrieval",
    status: "succeeded",
    outputs: {
      text: "Found documents."
    }
  }
};
