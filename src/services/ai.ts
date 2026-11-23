import { delay } from '@/lib/storage'

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

/** Only a server-side proxy URL is supported. API keys must never live in the browser bundle. */
const AI_API_URL = (import.meta.env.VITE_AI_API_URL || '') as string
const AI_MODEL = (import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini') as string
const AI_NOT_CONFIGURED = 'AI_NOT_CONFIGURED'

async function requestAI(system: string, prompt: string): Promise<string> {
  if (!AI_API_URL) throw new Error(AI_NOT_CONFIGURED)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30000)

  try {
    const headers = new Headers({ 'Content-Type': 'application/json' })

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    })

    const payload = await response.json() as ChatCompletionResponse
    if (!response.ok) {
      throw new Error(payload.error?.message || `AI request failed (${response.status})`)
    }

    const text = payload.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error('The AI returned an empty response')
    return text
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('استغرق المساعد وقتًا طويلًا للاستجابة. حاول مرة أخرى.', { cause: error })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

const waitForText = (text: string) => delay(Math.min(1900, 600 + text.length * 12))

const ideas = [
  'اليوم تذكّرت إن الإنجازات الكبيرة ما بتجيش فجأة… بتبدأ بخطوة صغيرة كل يوم. إيه أصغر خطوة عملتهااليوم وفتحت لك باب جديد؟ 🌱',
  'ثلاث أشياء أدهشتني هذا الأسبوع:\n١. محادثة مع شخص مختلف تمامًا عني.\n٢. كتاب بدأته من غير تخطيط.\n٣. لحظة صمت بدون هاتف 📵\nأنتم إيه اللي ألهمكم؟',
  'عمل تطوعي صغير في حيّك ممكن يغيّر يوم حد كامل. جرّبت قبل كدة؟ شاركنا التجربة 👇',
  'سؤال صريح: لو عندك ساعة إضافية كل يوم، هتقضيها في إيه؟ إجاباتكم بتلهمني جدًا ✨',
]

const improvements: Array<{ match: RegExp; output: string }> = [
  { match: /عملت|سويت|أنجزت/i, output: 'أنا فخور جدًا بما أنجزته اليوم! كانت رحلة مليئة بالتحديات، لكن النتيجة تستحق كل لحظة. شكرًا لكل من دعمني في الطريق 🙏' },
  { match: /حزن|تعب|إحباط|زعلان/i, output: 'مرّ اليوم ببعض اللحظات الصعبة، لكني أؤمن إن كل تجربة بتعلّمني شيئًا جديدًا. خفت شوية، بس رجعت أقف من جديد 💪' },
  { match: /صباح|مساء/i, output: 'صباح الخير يا أصدقاء ☀️ أتمنى لكم يومًا مليئًا بالطاقة والإنجاز. ابدأوه بابتسامة، فالخطوة دايمًا أصغر مما يبدو 😊' },
]

export async function generatePostIdea(topic = ''): Promise<string> {
  const clean = topic.trim()
  try {
    return await requestAI(
      'You are an expert Arabic social content creator. Write natural modern Arabic by default. Produce one engaging post with a clear hook, useful insight or question, short paragraphs, emojis when natural, and no disclaimer.',
      clean ? `اقترح منشورًا جذابًا لموضوع: ${clean}` : 'اقترح فكرة منشور اجتماعي جذابة ومختلفة عن يوميات أو إنجازات أو مجتمع.',
    )
  } catch (error) {
    await waitForText(topic || 'فكرة')
    if (error instanceof Error && error.message === AI_NOT_CONFIGURED) {
      const picked = ideas[Math.floor(Math.random() * ideas.length)]
      return clean
        ? `بمناسبة الحديث عن «${clean}»…\n${picked}\n\nما رأيكم أنتم؟ #تواصل`
        : picked
    }
    throw error
  }
}

export async function improvePost(text: string): Promise<string> {
  if (!text.trim()) throw new Error('اكتب النص أولًا عشان أقدر أحسّنه')
  try {
    return await requestAI(
      'You are a bilingual Arabic and English copy editor. Preserve the writer meaning and tone. Fix grammar and spelling, improve clarity and rhythm, keep the result suitable for a social post, and return only the improved text.',
      text.trim(),
    )
  } catch (error) {
    await waitForText(text)
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    const hit = improvements.find((item) => item.match.test(text))
    const base = hit?.output ?? `${text.trim().replace(/[.!؟]+$/, '')} — وهذه لحظة تستحق أن تُروى. شاركوني رأيكم في التعليقات 💬`
    return base.replace('نحن', 'إحنا')
  }
}

export async function translateText(text: string, target: 'ar' | 'en'): Promise<string> {
  if (!text.trim()) throw new Error('لا يوجد نص لترجمته')
  try {
    return await requestAI(
      target === 'ar'
        ? 'Translate the text naturally into modern Arabic (MSA). Preserve names, tone, and formatting. Return only the translation.'
        : 'Translate the text naturally into clear English. Preserve names, tone, and formatting. Return only the translation.',
      text.trim(),
    )
  } catch (error) {
    await waitForText(text)
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    if (target === 'ar') {
      return 'الترجمة غير متاحة حاليًا لأن مفتاح الذكاء الاصطناعي لم يُربط بعد.'
    }
    return 'Translation is unavailable until an AI API key or secure proxy is configured.'
  }
}

export async function summarizeComments(comments: string[]): Promise<string> {
  if (comments.length === 0) return 'لا توجد تعليقات لتلخيصها بعد.'
  try {
    return await requestAI(
      'Summarize a social-media comment thread accurately. Return a concise Arabic summary with: overall sentiment, recurring themes, questions, and one useful suggested response. Do not invent comments.',
      comments.map((comment, index) => `${index + 1}. ${comment}`).join('\n'),
    )
  } catch (error) {
    await waitForText(comments.join(' '))
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    return `ملخّص ${comments.length} تعليق:\n• يتضمن النقاش آراء متعددة حول المحتوى.\n• قد تحتاج متابعة الأسئلة المرتبطة بالتفاصيل.\n• يُقترح الرد باختصار وطلب رأي إضافي من الجمهور.`
  }
}

export async function suggestReplies(postContent: string): Promise<string[]> {
  try {
    const result = await requestAI(
      'Write three natural short Arabic replies to the given social post. Return each reply on a separate numbered line only. Make the replies distinct: supportive, thoughtful, and curious.',
      postContent.trim(),
    )
    return result
      .split(/\n/)
      .map((reply) => reply.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3)
  } catch (error) {
    await waitForText(postContent)
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    return [
      'فكرة جميلة جدًا! شكرًا لمشاركتها معنا 🙌',
      'أتفق معك تمامًا، خصوصًا النقطة الأخيرة. ممكن تشاركنا المزيد؟',
      'ألهمتني اليوم، منتظرين المزيد منك ✨',
    ]
  }
}

const botRules: Array<{ match: RegExp; reply: string }> = [
  { match: /مرحبا|السلام|هاي|أهلا/i, reply: 'أهلًا بك! أنا مساعد تواصل الذكي 🤖 ممكن أساعدك تكتب منشور، تحسّن نص، تلخّص تعليقات، أو حتى أترجم. قولي إيه اللي تحتاجه؟' },
  { match: /منشور|بوست|اكتب|أكتب/i, reply: 'أكيد! ممكن أجهّز لك فكرة منشور جاهزة. اكتب لي الموضوع اللي في بالك، أو اضغط زر «اقتراح فكرة» في أعلى الصفحة وأنا أتولى الباقي ✍️' },
  { match: /ترجم|translation|english/i, reply: 'أقدر أترجم لك من العربية للإنجليزية والعكس. افتح نافذة المساعد من نافذة كتابة المنشور واختر لغة الترجمة 🌐' },
  { match: /تعليق|كومنت|رد/i, reply: 'تحب ألخّص لك التعليقات أو أقترح ردود جاهزة؟ اضغط أيقونة المساعد بجانب أي منشور وهتلاقي الخيارات دي كلها 💬' },
  { match: /شكرا|تمام|ممتاز/i, reply: 'العفو! سعيد إني ساعدت 😊 لو احتجت أي حاجة تانية، أنا هنا.' },
]

export async function chatWithBot(message: string): Promise<string> {
  try {
    return await requestAI(
      'You are Tawasol AI, a helpful Arabic-first social media assistant. Help users create posts, improve writing, translate text, summarize feedback, and generate project or content ideas. Ask a short clarifying question only when truly needed. Be practical and concise.',
      message.trim(),
    )
  } catch (error) {
    await waitForText(message)
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    const rule = botRules.find((item) => item.match.test(message))
    return rule?.reply ??
      'المساعد يحتاج إعدادًا حقيقيًا للذكاء الاصطناعي. أضف مفتاح OpenAI أو رابط وسيط آمن في إعدادات المشروع، ثم أستطيع الرد والإبداع بدون قوالب ثابتة.'
  }
}
