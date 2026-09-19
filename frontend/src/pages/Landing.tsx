import { ArrowRight, Bot, Building2, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const stages = [
  {
    step: "01",
    title: "База знаний",
    text: "Сообщения родителей и абитуриентов сначала сверяются с частыми вопросами: сроки, документы, баллы, общежитие.",
    icon: MessageCircle,
  },
  {
    step: "02",
    title: "Ответ ИИ",
    text: "Если точного ответа нет, модель собирает ответ по похожим кейсам и помечает, что это не регламент учреждения.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Оператор",
    text: "Сложный диалог или прямая просьба «соедините с человеком» уходит в очередь операторов конкретного вуза или колледжа.",
    icon: Users,
  },
]

const pains = [
  {
    title: "Одинаковые вопросы каждый день",
    text: "Приёмная комиссия тратит смены на сроки подачи, список справок и стоимость обучения.",
  },
  {
    title: "Разные регламенты у учреждений",
    text: "Госвуз, частный университет и колледж отвечают по своим правилам — бот ведёт диалог в контексте площадки.",
  },
  {
    title: "Потерянные переписки",
    text: "WhatsApp, почта и стойка смешиваются. Opti-Bot держит все обращения в одной очереди с этапами обработки.",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="space-y-6">
            <Badge variant="secondary">Для частных и государственных учреждений</Badge>
            <h1 className="max-w-xl text-4xl font-medium tracking-tight text-balance md:text-5xl">
              Бот, который закрывает типовые вопросы приёмной, а сложные отдаёт людям
            </h1>
            <p className="max-w-lg text-muted-foreground text-pretty">
              Opti-Bot обрабатывает сообщения будущих студентов и родителей поэтапно: сначала база
              знаний, затем ИИ, затем оператор учреждения. Меньше очереди — быстрее ответ.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/inbox">
                  Открыть чаты
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Building2 className="size-4" /> Вузы и колледжи
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> Контекст учреждения
              </span>
              <span className="flex items-center gap-2">
                <Bot className="size-4" /> 3 уровня эскалации
              </span>
            </div>
          </div>
          <Card className="self-center">
            <CardHeader>
              <CardTitle>Как выглядит диалог</CardTitle>
              <CardDescription>Родитель пишет в канал учреждения — бот ведёт этапность сам.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                До какого числа принимаете документы на бакалавриат?
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="mb-1 text-xs font-medium text-primary">Этап 1 · база знаний</p>
                Приём до 25 августа. Список — онлайн или кабинет 102.
              </div>
              <div className="rounded-xl bg-muted p-3">А если многодетная семья, но прописка в городе?</div>
              <div className="rounded-xl border bg-background p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Этап 2 · ИИ</p>
                Точного правила нет. Льгота рассматривается комиссией по заявлению.
              </div>
              <div className="rounded-xl bg-muted p-3">Соедините с оператором, нужно согласовать дату.</div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Этап 3 · оператор НИШ
                </p>
                Диалог в очереди живого сотрудника учреждения.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
            {pains.map((item) => (
              <div key={item.title} className="space-y-2">
                <h2 className="text-lg font-medium">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="mb-3 text-sm font-medium text-primary">Три этапа</p>
          <h2 className="mb-10 max-w-2xl text-3xl font-medium tracking-tight">
            Сообщение не сразу падает на человека и не остаётся без ответа
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {stages.map((stage) => (
              <Card key={stage.step}>
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <stage.icon className="size-4" />
                  </div>
                  <CardDescription>{stage.step}</CardDescription>
                  <CardTitle>{stage.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{stage.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
