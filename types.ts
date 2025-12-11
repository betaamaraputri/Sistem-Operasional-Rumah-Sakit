export enum AgentType {
  ORCHESTRATOR = 'ORCHESTRATOR',
  PATIENT_MANAGEMENT = 'PATIENT_MANAGEMENT',
  APPOINTMENT_SCHEDULING = 'APPOINTMENT_SCHEDULING',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  BILLING_INSURANCE = 'BILLING_INSURANCE'
}

export interface AgentConfig {
  id: AgentType;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  iconName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  agent?: AgentType; // The agent who generated this message (if model)
  timestamp: Date;
}

export interface RoutingResult {
  targetAgent: AgentType;
  reasoning?: string;
}