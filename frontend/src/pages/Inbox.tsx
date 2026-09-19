import { useMemo, useState } from "react"
import { Check, Radio, Send, UserRound } from "lucide-react"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspace } from "@/context/WorkspaceContext"
import { cn } from "@/lib/utils"
import type { ConversationStatus, MessageAuthor, PipelineStage } from "@/types"

const statusLabel: Record<ConversationStatus, string> = {
  bot: "Бот",
  waiting: "Ждёт оператора",
  live: "С оператором",
  resolved: "Закрыт",
}

const stageLabel: Record<PipelineStage, string> = {
  knowledge: "База знаний",
  ai: "ИИ",
  operator: "Оператор",
}

const authorLabel: Record<MessageAuthor, string> = {
  client: "Клиент",
  bot: "Opti-Bot",
  operator: "Оператор",
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export function InboxPage() {
  const { conversations, activeId, setActiveId, sendOperatorMessage, takeOver, resolveChat, connection } =
    useWorkspace()
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...conversations]
      .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt))
      .filter((item) => {
        if (!q) return true
        return (
          item.visitorName.toLowerCase().includes(q) ||
          item.institution.toLowerCase().includes(q) ||
          item.messages.some((message) => message.text.toLowerCase().includes(q))
        )
      })
  }, [conversations, query])

  const active = conversations.find((item) => item.id === activeId) ?? filtered[0] ?? null

  const onSend = async () => {
    if (!active) return
    const text = draft
    setDraft("")
    await sendOperatorMessage(active.id, text)
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <SiteHeader solid />
      <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col border-r">
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-medium">Очередь чатов</h1>
              <Badge variant={connection === "live" ? "default" : "secondary"}>
                <Radio className="size-3" />
                {connection === "live" ? "Backend" : connection === "connecting" ? "Подключение" : "Демо realtime"}
              </Badge>
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по имени или вузу"
            />
            <p className="text-xs text-muted-foreground">
              Новые диалоги появляются сами. Если backend недоступен, работает демо-поток.
            </p>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-2 pb-4">
              {filtered.map((conversation) => {
                const last = conversation.messages.at(-1)
                const selected = active?.id === conversation.id
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveId(conversation.id)}
                    className={cn(
                      "mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted",
                      selected && "bg-muted",
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials(conversation.visitorName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{conversation.visitorName}</span>
                        {conversation.unread > 0 ? (
                          <Badge>{conversation.unread}</Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{conversation.institution}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{last?.text}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

        {active ? (
          <section className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-medium">{active.visitorName}</h2>
                  <Badge variant="outline">{statusLabel[active.status]}</Badge>
                  <Badge variant="secondary">{stageLabel[active.stage]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {active.visitorRole} · {active.institution} ·{" "}
                  {active.institutionKind === "public" ? "гос. учреждение" : "частное учреждение"}
                </p>
              </div>
              <div className="flex gap-2">
                {active.status !== "live" && active.status !== "resolved" ? (
                  <Button size="sm" onClick={() => takeOver(active.id)}>
                    <UserRound />
                    Взять диалог
                  </Button>
                ) : null}
                {active.status !== "resolved" ? (
                  <Button size="sm" variant="outline" onClick={() => resolveChat(active.id)}>
                    <Check />
                    Закрыть
                  </Button>
                ) : null}
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
                {active.messages.map((message) => {
                  const mine = message.author !== "client"
                  return (
                    <div
                      key={message.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <p className={cn("mb-1 text-[11px] opacity-80")}>
                          {authorLabel[message.author]} · {stageLabel[message.stage]} ·{" "}
                          {formatTime(message.createdAt)}
                        </p>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <Separator />
            <form
              className="mx-auto flex w-full max-w-3xl items-end gap-2 p-4"
              onSubmit={(event) => {
                event.preventDefault()
                void onSend()
              }}
            >
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  active.status === "resolved"
                    ? "Диалог закрыт"
                    : "Ответ клиенту. Enter — отправить"
                }
                disabled={active.status === "resolved"}
                className="min-h-16 resize-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void onSend()
                  }
                }}
              />
              <Button type="submit" disabled={active.status === "resolved" || !draft.trim()}>
                <Send />
              </Button>
            </form>
          </section>
        ) : (
          <div className="grid place-items-center text-sm text-muted-foreground">Чатов пока нет</div>
        )}
      </div>
    </div>
  )
}
