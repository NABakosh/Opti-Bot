import { useEffect, useState, type FormEvent } from "react"
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  createKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  fetchKnowledgeBase,
  updateKnowledgeBaseEntry,
  type KnowledgeBaseEntry,
} from "@/lib/backend"

export function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuestion, setEditQuestion] = useState("")
  const [editAnswer, setEditAnswer] = useState("")
  const [saving, setSaving] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchKnowledgeBase()
      .then((data) => {
        setEntries(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    const question = newQuestion.trim()
    const answer = newAnswer.trim()
    if (!question || !answer) return

    setCreating(true)
    try {
      const entry = await createKnowledgeBaseEntry(question, answer)
      setEntries((current) => [entry, ...current])
      setNewQuestion("")
      setNewAnswer("")
      toast.success("Запись добавлена")
    } catch {
      toast.error("Не удалось добавить запись — бэкенд недоступен")
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (entry: KnowledgeBaseEntry) => {
    setEditingId(entry.id)
    setEditQuestion(entry.question)
    setEditAnswer(entry.answer)
    setConfirmDeleteId(null)
  }

  const onSaveEdit = async (id: number) => {
    const question = editQuestion.trim()
    const answer = editAnswer.trim()
    if (!question || !answer) return

    setSaving(true)
    try {
      const updated = await updateKnowledgeBaseEntry(id, question, answer)
      setEntries((current) => current.map((item) => (item.id === id ? updated : item)))
      setEditingId(null)
      toast.success("Запись обновлена")
    } catch {
      toast.error("Не удалось сохранить изменения")
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteKnowledgeBaseEntry(id)
      setEntries((current) => current.filter((item) => item.id !== id))
      toast.success("Запись удалена")
    } catch {
      toast.error("Не удалось удалить запись")
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="min-h-svh bg-muted/30">
      <SiteHeader solid />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">База знаний</h1>
            <p className="text-sm text-muted-foreground">
              Бот отвечает отсюда напрямую, если вопрос клиента похож на один из этих. Не найдёт совпадения —
              уйдёт в ИИ.
            </p>
          </div>
          <Badge variant="secondary">{entries.length} записей</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Добавить запись</CardTitle>
            <CardDescription>Формулируйте вопрос так, как его обычно задают клиенты</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-3">
              <Textarea
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                placeholder="Вопрос, например: Как подать документы?"
                className="min-h-12"
              />
              <Textarea
                value={newAnswer}
                onChange={(event) => setNewAnswer(event.target.value)}
                placeholder="Ответ бота на этот вопрос"
                className="min-h-20"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={creating || !newQuestion.trim() || !newAnswer.trim()}>
                  {creating ? <Loader2 className="animate-spin" /> : <Plus />}
                  Добавить
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Все записи</CardTitle>
            <CardDescription>Изменения применяются сразу — следующий вопрос бот сверит уже с ними</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Загрузка…</p>
            ) : loadError ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Не удалось загрузить базу знаний — проверьте, что бэкенд запущен.
              </p>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Записей пока нет — добавьте первую выше.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/5">Вопрос</TableHead>
                    <TableHead>Ответ</TableHead>
                    <TableHead className="w-24 text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const isEditing = editingId === entry.id
                    return (
                      <TableRow key={entry.id}>
                        {isEditing ? (
                          <>
                            <TableCell className="align-top whitespace-normal">
                              <Textarea
                                value={editQuestion}
                                onChange={(event) => setEditQuestion(event.target.value)}
                                className="min-h-10"
                                autoFocus
                              />
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              <Textarea
                                value={editAnswer}
                                onChange={(event) => setEditAnswer(event.target.value)}
                                className="min-h-10"
                              />
                            </TableCell>
                            <TableCell className="align-top text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => onSaveEdit(entry.id)}
                                  disabled={saving || !editQuestion.trim() || !editAnswer.trim()}
                                >
                                  {saving ? <Loader2 className="animate-spin" /> : <Check />}
                                </Button>
                                <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  <X />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="align-top whitespace-normal">{entry.question}</TableCell>
                            <TableCell className="align-top whitespace-normal text-muted-foreground">
                              {entry.answer}
                            </TableCell>
                            <TableCell className="align-top text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon-sm" variant="ghost" onClick={() => startEdit(entry)}>
                                  <Pencil />
                                </Button>
                                {confirmDeleteId === entry.id ? (
                                  <Button
                                    size="icon-sm"
                                    variant="destructive"
                                    onClick={() => onDelete(entry.id)}
                                    disabled={deletingId === entry.id}
                                  >
                                    {deletingId === entry.id ? <Loader2 className="animate-spin" /> : <Check />}
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => setConfirmDeleteId(entry.id)}
                                  >
                                    <Trash2 />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
