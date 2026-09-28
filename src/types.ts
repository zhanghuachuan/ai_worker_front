// Types matching the backend API responses.

export interface AgentState {
  name: string;
  display_name: string;
  description: string;
  type: string;
  status: string; // idle | processing
  pending_count: number;
  last_output: string;
  last_active: string; // ISO timestamp
}

export interface AgentsResponse {
  success: boolean;
  agents: AgentState[];
  entry_agent: string;
}

export interface TaskMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  type: string; // assign | request_clarify | reply | result | feedback | notify
  priority: string; // critical | high | medium | low
  status: string; // pending | processing | done | failed
  content: string;
  timestamp: string; // ISO timestamp
}

export interface MessagesResponse {
  success: boolean;
  messages: TaskMessage[];
}

export interface TaskStatusResponse {
  success: boolean;
  task_id: string;
  messages: TaskMessage[];
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  task_id?: string;
  message?: string;
  error?: string;
}
