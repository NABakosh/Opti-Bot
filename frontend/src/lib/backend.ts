import { api } from "@/lib/api"
import type { ChatMessage, Conversation, ConversationStatus, PipelineStage } from "@/types"

type BackendSender = "user" | "bot" | "operator"

type BackendMessage = {
  id: number
  sender: BackendSender
  text: string
  created_at: string
}

type BackendConversation = {
  id: number
  chat_id: string
  escalated: boolean
  created_at: string
  updated_at: string
}

type BackendConversationDetail = BackendConversation & {
  messages: BackendMessage[]
}

// У бэкенда пока нет мультиарендности, имени посетителя и разбивки по стадиям (knowledge/ai) —
// эти поля ниже подставляются как заглушки, пока бэкенд их не отдаёт по-настоящему.
const INSTITUTION_NAME = "Opti-Bot"
const VISITOR_ROLE = "Клиент WhatsApp"

function visitorName(chatId: string) {
  return chatId.replace(/@c\.us$/, "")
}

function mapAuthor(sender: BackendSender): ChatMessage["author"] {
  if (sender === "user") return "client"
  if (sender === "operator") return "operator"
  return "bot"
}

function mapStage(escalated: boolean): PipelineStage {
  return escalated ? "operator" : "knowledge"
}

function mapStatus(escalated: boolean, messages: BackendMessage[]): ConversationStatus {
  if (!escalated) return "bot"
  return messages.some((message) => message.sender === "operator") ? "live" : "waiting"
}

function mapMessage(conversationId: string, escalated: boolean, message: BackendMessage): ChatMessage {
  return {
    id: String(message.id),
    conversationId,
    author: mapAuthor(message.sender),
    stage: message.sender === "operator" || escalated ? "operator" : mapStage(escalated),
    text: message.text,
    createdAt: message.created_at,
  }
}

export function mapConversationDetail(raw: BackendConversationDetail): Conversation {
  const id = String(raw.id)
  return {
    id,
    visitorName: visitorName(raw.chat_id),
    visitorRole: VISITOR_ROLE,
    institution: INSTITUTION_NAME,
    institutionKind: "private",
    status: mapStatus(raw.escalated, raw.messages),
    stage: mapStage(raw.escalated),
    unread: 0,
    lastMessageAt: raw.updated_at,
    messages: raw.messages.map((message) => mapMessage(id, raw.escalated, message)),
  }
}

async function fetchConversationDetail(id: string): Promise<Conversation> {
  const { data } = await api.get<BackendConversationDetail>(`/conversations/${id}`)
  return mapConversationDetail(data)
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<BackendConversation[]>("/conversations/")
  // Список отдаёт только метаданные — тянем детали, чтобы был превью последнего сообщения
  // и поиск по тексту в Inbox. Нормально для хакатон-масштаба (десятки диалогов, не тысячи).
  return Promise.all(data.map((item) => fetchConversationDetail(String(item.id))))
}

export async function replyToConversation(id: string, text: string): Promise<Conversation> {
  const { data } = await api.post<BackendConversationDetail>(`/conversations/${id}/reply`, { text })
  return mapConversationDetail(data)
}

export async function escalateConversation(id: string): Promise<void> {
  await api.post(`/conversations/${id}/escalate`)
}

export async function resolveConversation(id: string): Promise<void> {
  await api.post(`/conversations/${id}/resolve`)
}

// --- База знаний ---

export type KnowledgeBaseEntry = {
  id: number
  question: string
  answer: string
  createdAt: string
}

type BackendKnowledgeBaseEntry = {
  id: number
  question: string
  answer: string
  created_at: string
}

function mapKnowledgeBaseEntry(raw: BackendKnowledgeBaseEntry): KnowledgeBaseEntry {
  return { id: raw.id, question: raw.question, answer: raw.answer, createdAt: raw.created_at }
}

export async function fetchKnowledgeBase(): Promise<KnowledgeBaseEntry[]> {
  const { data } = await api.get<BackendKnowledgeBaseEntry[]>("/knowledge-base/")
  return data.map(mapKnowledgeBaseEntry)
}

export async function createKnowledgeBaseEntry(question: string, answer: string): Promise<KnowledgeBaseEntry> {
  const { data } = await api.post<BackendKnowledgeBaseEntry>("/knowledge-base/", { question, answer })
  return mapKnowledgeBaseEntry(data)
}

export async function updateKnowledgeBaseEntry(
  id: number,
  question: string,
  answer: string,
): Promise<KnowledgeBaseEntry> {
  const { data } = await api.put<BackendKnowledgeBaseEntry>(`/knowledge-base/${id}`, { question, answer })
  return mapKnowledgeBaseEntry(data)
}

export async function deleteKnowledgeBaseEntry(id: number): Promise<void> {
  await api.delete(`/knowledge-base/${id}`)
}
