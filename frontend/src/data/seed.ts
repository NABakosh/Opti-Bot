import type { BotStats, Conversation } from "@/types"

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function dayOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

export const seedConversations: Conversation[] = [
  {
    id: "c-1",
    visitorName: "Айгуль Нурланова",
    visitorRole: "Родитель абитуриента",
    institution: "Astana IT University",
    institutionKind: "private",
    status: "bot",
    stage: "knowledge",
    unread: 0,
    lastMessageAt: minutesAgo(4),
    messages: [
      {
        id: "m-1-1",
        conversationId: "c-1",
        author: "client",
        stage: "knowledge",
        text: "Здравствуйте, до какого числа принимаете документы на бакалавриат?",
        createdAt: minutesAgo(8),
      },
      {
        id: "m-1-2",
        conversationId: "c-1",
        author: "bot",
        stage: "knowledge",
        text: "Приём документов на бакалавриат — до 25 августа. Список можно подать онлайн или в приёмной комиссии, кабинет 102.",
        createdAt: minutesAgo(7),
      },
      {
        id: "m-1-3",
        conversationId: "c-1",
        author: "client",
        stage: "knowledge",
        text: "Нужен ли оригинал аттестата сразу?",
        createdAt: minutesAgo(4),
      },
    ],
  },
  {
    id: "c-2",
    visitorName: "Марат Сериков",
    visitorRole: "Абитуриент",
    institution: "КазНУ им. аль-Фараби",
    institutionKind: "public",
    status: "bot",
    stage: "ai",
    unread: 1,
    lastMessageAt: minutesAgo(12),
    messages: [
      {
        id: "m-2-1",
        conversationId: "c-2",
        author: "client",
        stage: "knowledge",
        text: "Можно ли совмещать грант и платное общежитие, если баллов не хватило на льготу?",
        createdAt: minutesAgo(25),
      },
      {
        id: "m-2-2",
        conversationId: "c-2",
        author: "bot",
        stage: "ai",
        text: "В базе знаний точного правила нет. По типовой практике грант покрывает обучение, а общежитие оплачивается отдельно. Льгота на жильё рассматривается комиссией по заявлению.",
        createdAt: minutesAgo(23),
      },
      {
        id: "m-2-3",
        conversationId: "c-2",
        author: "client",
        stage: "ai",
        text: "А если я из многодетной семьи, но прописка в Алматы?",
        createdAt: minutesAgo(12),
      },
    ],
  },
  {
    id: "c-3",
    visitorName: "Елена Петрова",
    visitorRole: "Родитель",
    institution: "НИШ г. Астана",
    institutionKind: "public",
    status: "waiting",
    stage: "operator",
    unread: 2,
    lastMessageAt: minutesAgo(2),
    messages: [
      {
        id: "m-3-1",
        conversationId: "c-3",
        author: "client",
        stage: "knowledge",
        text: "Когда результаты конкурса и можно ли перенести собеседование?",
        createdAt: minutesAgo(40),
      },
      {
        id: "m-3-2",
        conversationId: "c-3",
        author: "bot",
        stage: "ai",
        text: "Результаты публикуются в личном кабинете. Перенос собеседования зависит от расписания приёмной комиссии конкретной площадки.",
        createdAt: minutesAgo(38),
      },
      {
        id: "m-3-3",
        conversationId: "c-3",
        author: "client",
        stage: "operator",
        text: "Соедините с оператором, пожалуйста. Нужно согласовать дату из-за командировки.",
        createdAt: minutesAgo(2),
      },
    ],
  },
  {
    id: "c-4",
    visitorName: "Данияр Омаров",
    visitorRole: "Абитуриент",
    institution: "KBTU",
    institutionKind: "private",
    status: "live",
    stage: "operator",
    unread: 0,
    lastMessageAt: minutesAgo(1),
    messages: [
      {
        id: "m-4-1",
        conversationId: "c-4",
        author: "client",
        stage: "operator",
        text: "Мне сказали, что договор на платное обучение уже закрыт. Это так?",
        createdAt: minutesAgo(18),
      },
      {
        id: "m-4-2",
        conversationId: "c-4",
        author: "operator",
        stage: "operator",
        text: "Проверяю слоты по IT-факультету. Набор ещё открыт, но осталось 12 мест.",
        createdAt: minutesAgo(6),
      },
      {
        id: "m-4-3",
        conversationId: "c-4",
        author: "client",
        stage: "operator",
        text: "Можно забронировать место сегодня вечером?",
        createdAt: minutesAgo(1),
      },
    ],
  },
  {
    id: "c-5",
    visitorName: "Сауле Ибраева",
    visitorRole: "Родитель",
    institution: "Колледж сферы услуг",
    institutionKind: "public",
    status: "resolved",
    stage: "knowledge",
    unread: 0,
    lastMessageAt: hoursAgo(5),
    messages: [
      {
        id: "m-5-1",
        conversationId: "c-5",
        author: "client",
        stage: "knowledge",
        text: "Какой проходной балл на повара и есть ли форма обучения после 9 класса?",
        createdAt: hoursAgo(6),
      },
      {
        id: "m-5-2",
        conversationId: "c-5",
        author: "bot",
        stage: "knowledge",
        text: "После 9 класса набор открыт. Средний балл аттестата — от 3.8. Документы принимаются до 20 августа.",
        createdAt: hoursAgo(5),
      },
    ],
  },
]

export const seedStats: BotStats = {
  messagesTotal: 1842,
  conversationsTotal: 613,
  knowledgeResolved: 428,
  aiResolved: 129,
  operatorTransfers: 56,
  avgFirstReplySec: 4.8,
  satisfaction: 94,
  daily: Array.from({ length: 14 }, (_, index) => {
    const offset = 13 - index
    return {
      date: dayOffset(offset),
      knowledge: 22 + ((index * 7) % 11),
      ai: 6 + ((index * 3) % 8),
      operator: 2 + (index % 4),
    }
  }),
  topQuestions: [
    { question: "Сроки приёма документов", count: 186, stage: "knowledge" },
    { question: "Список документов для поступления", count: 142, stage: "knowledge" },
    { question: "Общежитие и льготы", count: 97, stage: "ai" },
    { question: "Перенос собеседования", count: 41, stage: "operator" },
    { question: "Стоимость платного обучения", count: 88, stage: "knowledge" },
  ],
}

export const incomingPool = [
  {
    visitorName: "Нурлан Беков",
    visitorRole: "Абитуриент",
    institution: "ENU им. Л.Н. Гумилёва",
    institutionKind: "public" as const,
    text: "Подскажите, засчитывается ли сертификат IELTS вместо внутреннего теста?",
  },
  {
    visitorName: "Камила Жунусова",
    visitorRole: "Родитель",
    institution: "SDU University",
    institutionKind: "private" as const,
    text: "Можно ли подать документы онлайн, если ребёнок ещё сдаёт ЕНТ?",
  },
  {
    visitorName: "Тимур Ахметов",
    visitorRole: "Абитуриент",
    institution: "Satbayev University",
    institutionKind: "public" as const,
    text: "Есть ли вечерняя форма на программную инженерию?",
  },
]
