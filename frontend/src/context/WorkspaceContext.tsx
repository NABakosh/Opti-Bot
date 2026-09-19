import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { api, wsUrl } from "@/lib/api"
import {
  appendMessage,
  autoBotReply,
  bumpDaily,
  createIncomingConversation,
  loadConversations,
  loadStats,
  markRead,
  resetWorkspace,
  saveConversations,
  saveStats,
  setConversationStatus,
} from "@/lib/workspace"
import type { BotStats, Conversation, PipelineStage } from "@/types"

type ConnectionState = "connecting" | "live" | "demo"

type WorkspaceValue = {
  conversations: Conversation[]
  stats: BotStats
  connection: ConnectionState
  activeId: string | null
  setActiveId: (id: string | null) => void
  sendOperatorMessage: (conversationId: string, text: string) => Promise<void>
  takeOver: (conversationId: string) => void
  resolveChat: (conversationId: string) => void
  resetDemo: () => void
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations())
  const [stats, setStats] = useState<BotStats>(() => loadStats())
  const [connection, setConnection] = useState<ConnectionState>("connecting")
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null)
  const incomingIndex = useRef(0)
  const conversationsRef = useRef(conversations)

  useEffect(() => {
    conversationsRef.current = conversations
    saveConversations(conversations)
  }, [conversations])

  useEffect(() => {
    saveStats(stats)
  }, [stats])

  const applyIncoming = useCallback(
    (conversationId: string, text: string, stage: PipelineStage = "knowledge") => {
      setConversations((current) =>
        appendMessage(current, conversationId, { author: "client", stage, text }, true),
      )
      setStats((current) => bumpDaily(current, stage))
    },
    [],
  )

  useEffect(() => {
    let socket: WebSocket | null = null
    let cancelled = false
    let demoTimer: number | undefined

    const startDemo = () => {
      if (cancelled) return
      setConnection("demo")
      demoTimer = window.setInterval(() => {
        const list = conversationsRef.current
        const liveOrWaiting = list.filter((item) => item.status !== "resolved")
        const roll = Math.random()
        if (roll > 0.55 || liveOrWaiting.length === 0) {
          const next = createIncomingConversation(incomingIndex.current++)
          setConversations((current) => [next, ...current])
          setStats((current) => ({
            ...bumpDaily(current, "knowledge"),
            conversationsTotal: current.conversationsTotal + 1,
          }))
          toast.message("Новый чат", { description: `${next.visitorName} · ${next.institution}` })
          return
        }
        const target = liveOrWaiting[Math.floor(Math.random() * liveOrWaiting.length)]
        const extras = [
          "Ещё вопрос: можно ли принести документы после работы, до 19:00?",
          "Спасибо, жду подтверждение.",
          "Переведите на оператора, пожалуйста.",
          "А стипендия сохраняется при академическом отпуске?",
        ]
        applyIncoming(target.id, extras[Math.floor(Math.random() * extras.length)], target.stage)
      }, 14000)
    }

    const connect = async () => {
      try {
        await api.get("/health")
        if (cancelled) return
        socket = new WebSocket(wsUrl())
        socket.onopen = () => {
          if (!cancelled) setConnection("live")
        }
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as {
              type?: string
              conversationId?: string
              text?: string
              conversation?: Conversation
            }
            if (payload.type === "conversation" && payload.conversation) {
              setConversations((current) => [payload.conversation!, ...current])
              return
            }
            if (payload.conversationId && payload.text) {
              applyIncoming(payload.conversationId, payload.text)
            }
          } catch {
            /* ignore malformed frames */
          }
        }
        socket.onerror = () => {
          socket?.close()
        }
        socket.onclose = () => {
          if (!cancelled) startDemo()
        }
      } catch {
        startDemo()
      }
    }

    void connect()

    return () => {
      cancelled = true
      socket?.close()
      if (demoTimer) window.clearInterval(demoTimer)
    }
  }, [applyIncoming])

  const sendOperatorMessage = useCallback(async (conversationId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setConversations((current) =>
      appendMessage(current, conversationId, {
        author: "operator",
        stage: "operator",
        text: trimmed,
      }),
    )
    setStats((current) => bumpDaily(current, "operator"))

    try {
      await api.post(`/chats/${conversationId}/messages`, { text: trimmed, author: "operator" })
    } catch {
      const conversation = conversationsRef.current.find((item) => item.id === conversationId)
      if (conversation?.status === "bot") {
        const reply = autoBotReply(trimmed)
        window.setTimeout(() => {
          setConversations((current) =>
            appendMessage(current, conversationId, {
              author: "bot",
              stage: reply.stage,
              text: reply.text,
            }),
          )
          setStats((current) => {
            const next = bumpDaily(current, reply.stage)
            if (reply.stage === "operator") {
              return { ...next, operatorTransfers: next.operatorTransfers + 1 }
            }
            return next
          })
          if (reply.stage === "operator") {
            setConversations((current) =>
              setConversationStatus(current, conversationId, "waiting", "operator"),
            )
          }
        }, 700)
      }
    }
  }, [])

  const takeOver = useCallback((conversationId: string) => {
    setConversations((current) =>
      setConversationStatus(current, conversationId, "live", "operator"),
    )
    setStats((current) => ({
      ...current,
      operatorTransfers: current.operatorTransfers + 1,
    }))
    toast.success("Диалог у оператора")
  }, [])

  const resolveChat = useCallback((conversationId: string) => {
    setConversations((current) => setConversationStatus(current, conversationId, "resolved"))
  }, [])

  const resetDemo = useCallback(() => {
    resetWorkspace()
    const nextChats = loadConversations()
    setConversations(nextChats)
    setStats(loadStats())
    setActiveId(nextChats[0]?.id ?? null)
    toast.success("Демо-данные сброшены")
  }, [])

  const selectChat = useCallback((id: string | null) => {
    setActiveId(id)
    if (id) setConversations((current) => markRead(current, id))
  }, [])

  const value = useMemo(
    () => ({
      conversations,
      stats,
      connection,
      activeId,
      setActiveId: selectChat,
      sendOperatorMessage,
      takeOver,
      resolveChat,
      resetDemo,
    }),
    [
      conversations,
      stats,
      connection,
      activeId,
      selectChat,
      sendOperatorMessage,
      takeOver,
      resolveChat,
      resetDemo,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error("WorkspaceProvider is required")
  return value
}
