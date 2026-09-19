import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useWorkspace } from "@/context/WorkspaceContext"
import type { PipelineStage } from "@/types"

const stageLabel: Record<PipelineStage, string> = {
  knowledge: "База знаний",
  ai: "ИИ",
  operator: "Оператор",
}

function formatDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  })
}

export function StatsPage() {
  const { stats, conversations, resetDemo } = useWorkspace()
  const resolved = stats.knowledgeResolved + stats.aiResolved
  const funnelTotal = resolved + stats.operatorTransfers || 1

  const kpis = [
    { label: "Сообщений", value: stats.messagesTotal.toLocaleString("ru-RU") },
    { label: "Диалогов", value: stats.conversationsTotal.toLocaleString("ru-RU") },
    { label: "Закрыто базой знаний", value: stats.knowledgeResolved.toLocaleString("ru-RU") },
    { label: "Закрыто ИИ", value: stats.aiResolved.toLocaleString("ru-RU") },
    { label: "Переводы на оператора", value: stats.operatorTransfers.toLocaleString("ru-RU") },
    { label: "Первый ответ", value: `${stats.avgFirstReplySec} сек` },
  ]

  return (
    <div className="min-h-svh bg-muted/30">
      <SiteHeader solid />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Статистика бота</h1>
            <p className="text-sm text-muted-foreground">
              Все цифры хранятся в браузере. Новые сообщения из чатов сразу попадают в график.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Удовлетворённость {stats.satisfaction}%</Badge>
            <Button variant="outline" onClick={resetDemo}>
              Сбросить демо
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((item) => (
            <Card key={item.label} size="sm">
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-2xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Нагрузка за 14 дней</CardTitle>
              <CardDescription>Разбивка по этапам обработки</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={formatDay} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip labelFormatter={(value) => formatDay(String(value))} />
                  <Area
                    type="monotone"
                    dataKey="knowledge"
                    name="База знаний"
                    stackId="1"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.35}
                  />
                  <Area
                    type="monotone"
                    dataKey="ai"
                    name="ИИ"
                    stackId="1"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.35}
                  />
                  <Area
                    type="monotone"
                    dataKey="operator"
                    name="Оператор"
                    stackId="1"
                    stroke="var(--chart-4)"
                    fill="var(--chart-4)"
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Воронка этапов</CardTitle>
              <CardDescription>Где заканчивается диалог</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  ["knowledge", stats.knowledgeResolved],
                  ["ai", stats.aiResolved],
                  ["operator", stats.operatorTransfers],
                ] as const
              ).map(([stage, value]) => (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{stageLabel[stage]}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((value / funnelTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Сейчас открыто чатов: {conversations.filter((item) => item.status !== "resolved").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Частые вопросы</CardTitle>
            <CardDescription>То, что база знаний должна закрывать в первую очередь</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Вопрос</TableHead>
                  <TableHead>Этап</TableHead>
                  <TableHead className="text-right">Обращений</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topQuestions.map((item) => (
                  <TableRow key={item.question}>
                    <TableCell>{item.question}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stageLabel[item.stage]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
