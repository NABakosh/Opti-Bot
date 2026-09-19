import { incomingPool, seedConversations, seedStats } from "@/data/seed"
import type {
  BotStats,
  ChatMessage,
  Conversation,
  ConversationStatus,
  PipelineStage,
} from "@/types"

const CHATS_KEY = "optibot.chats"
const STATS_KEY = "optibot.stats"

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadConversations(): Conversation[] {
  return parse(localStorage.getItem(CHATS_KEY), seedConversations)
}

export function loadStats(): BotStats {
  return parse(localStorage.getItem(STATS_KEY), seedStats)
}

export function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(conversations))
}

export function saveStats(stats: BotStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export function resetWorkspace() {
  localStorage.removeItem(CHATS_KEY)
  localStorage.removeItem(STATS_KEY)
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function bumpDaily(stats: BotStats, stage: PipelineStage): BotStats {
  const date = todayKey()
  const daily = stats.daily.map((row) => {
    if (row.date !== date) return row
    return { ...row, [stage]: row[stage] + 1 }
  })
  const hasToday = stats.daily.some((row) => row.date === date)
  return {
    ...stats,
    messagesTotal: stats.messagesTotal + 1,
    daily: hasToday
      ? daily
      : [...stats.daily.slice(1), { date, knowledge: 0, ai: 0, operator: 0, [stage]: 1 }],
  }
}

export function appendMessage(
  conversations: Conversation[],
  conversationId: string,
  message: Omit<ChatMessage, "id" | "conversationId" | "createdAt"> & {
    createdAt?: string
  },
  unreadForOperator = false,
): Conversation[] {
  return conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation
    const next: ChatMessage = {
      id: uid("m"),
      conversationId,
      createdAt: message.createdAt ?? new Date().toISOString(),
      author: message.author,
      stage: message.stage,
      text: message.text,
    }
    return {
      ...conversation,
      messages: [...conversation.messages, next],
      lastMessageAt: next.createdAt,
      unread: unreadForOperator ? conversation.unread + 1 : 0,
      stage: message.stage,
    }
  })
}

export function markRead(conversations: Conversation[], conversationId: string) {
  return conversations.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
  )
}

export function setConversationStatus(
  conversations: Conversation[],
  conversationId: string,
  status: ConversationStatus,
  stage?: PipelineStage,
) {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? { ...conversation, status, stage: stage ?? conversation.stage, unread: 0 }
      : conversation,
  )
}

export function createIncomingConversation(index: number): Conversation {
  const sample = incomingPool[index % incomingPool.length]
  const createdAt = new Date().toISOString()
  const id = uid("c")
  return {
    id,
    visitorName: sample.visitorName,
    visitorRole: sample.visitorRole,
    institution: sample.institution,
    institutionKind: sample.institutionKind,
    status: "bot",
    stage: "knowledge",
    unread: 1,
    lastMessageAt: createdAt,
    messages: [
      {
        id: uid("m"),
        conversationId: id,
        author: "client",
        stage: "knowledge",
        text: sample.text,
        createdAt,
      },
    ],
  }
}

export function autoBotReply(text: string): { stage: PipelineStage; text: string } {
  const lower = text.toLowerCase()
  if (lower.includes("оператор") || lower.includes("человек") || lower.includes("живого")) {
    return {
      stage: "operator",
      text: "Перевожу диалог на оператора учреждения. Обычно ответ занимает 1–3 минуты.",
    }
  }
  if (
    lower.includes("документ") ||
    lower.includes("срок") ||
    lower.includes("балл") ||
    lower.includes("ент")
  ) {
    return {
      stage: "knowledge",
      text: "Ответ из базы знаний: актуальные сроки и перечень документов опубликованы в приёмной кампании. Могу сразу открыть карточку программы, если напишете специальность.",
    }
  }
  return {
    stage: "ai",
    text: "В базе знаний точного совпадения нет. Сформировал ответ по похожим кейсам. Если нужно официальное подтверждение — попросите перевод на оператора.",
  }
}
