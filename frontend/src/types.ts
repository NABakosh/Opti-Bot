export type PipelineStage = "knowledge" | "ai" | "operator"

export type MessageAuthor = "client" | "bot" | "operator"

export type ConversationStatus = "bot" | "waiting" | "live" | "resolved"

export type InstitutionKind = "private" | "public"

export type ChatMessage = {
  id: string
  conversationId: string
  author: MessageAuthor
  stage: PipelineStage
  text: string
  createdAt: string
}

export type Conversation = {
  id: string
  visitorName: string
  visitorRole: string
  institution: string
  institutionKind: InstitutionKind
  status: ConversationStatus
  stage: PipelineStage
  unread: number
  lastMessageAt: string
  messages: ChatMessage[]
}

export type DailyStat = {
  date: string
  knowledge: number
  ai: number
  operator: number
}

export type TopQuestion = {
  question: string
  count: number
  stage: PipelineStage
}

export type BotStats = {
  messagesTotal: number
  conversationsTotal: number
  knowledgeResolved: number
  aiResolved: number
  operatorTransfers: number
  avgFirstReplySec: number
  satisfaction: number
  daily: DailyStat[]
  topQuestions: TopQuestion[]
}
