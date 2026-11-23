interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

/** Only a server-side proxy URL is supported. API keys must never live in the browser bundle. */
const AI_API_URL = (import.meta.env.VITE_AI_API_URL || '') as string
const AI_MODEL = (import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini') as string
const AI_NOT_CONFIGURED = 'AI_NOT_CONFIGURED'

/** User-facing message when no AI proxy is configured. Never fake a model response. */
const AI_UNAVAILABLE_MESSAGE = 'مساعد الذكاء الاصطناعي غير مُعدّ بعد في هذه النسخة. أضف رابط وسيط آمن في VITE_AI_API_URL لتفعيله.'

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

export async function generatePostIdea(topic = ''): Promise<string> {
  const clean = topic.trim()
  try {
    return await requestAI(
      'You are an expert Arabic social content creator. Write natural modern Arabic by default. Produce one engaging post with a clear hook, useful insight or question, short paragraphs, emojis when natural, and no disclaimer.',
      clean ? `اقترح منشورًا جذابًا لموضوع: ${clean}` : 'اقترح فكرة منشور اجتماعي جذابة ومختلفة عن يوميات أو إنجازات أو مجتمع.',
    )
  } catch (error) {
    if (error instanceof Error && error.message === AI_NOT_CONFIGURED) {
      throw new Error(AI_UNAVAILABLE_MESSAGE, { cause: error })
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
    if (error instanceof Error && error.message === AI_NOT_CONFIGURED) {
      throw new Error(AI_UNAVAILABLE_MESSAGE, { cause: error })
    }
    throw error
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
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    if (target === 'ar') {
      return 'الترجمة غير متاحة حاليًا لأن مساعد الذكاء الاصطناعي لم يُعدّ بعد.'
    }
    return 'Translation is unavailable until a secure AI proxy is configured.'
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
    if (error instanceof Error && error.message === AI_NOT_CONFIGURED) {
      throw new Error(AI_UNAVAILABLE_MESSAGE, { cause: error })
    }
    throw error
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
    if (error instanceof Error && error.message === AI_NOT_CONFIGURED) {
      throw new Error(AI_UNAVAILABLE_MESSAGE, { cause: error })
    }
    throw error
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
    if (!(error instanceof Error) || error.message !== AI_NOT_CONFIGURED) throw error
    // Rule-based fallback for the demo build. Always labeled so nobody mistakes it
    // for a real model response.
    const rule = botRules.find((item) => item.match.test(message))
    const fallback = rule?.reply ??
      'المساعد يحتاج إعدادًا حقيقيًا للذكاء الاصطناعي. أضف رابط وسيط آمن في VITE_AI_API_URL بإعدادات المشروع، وبعدها أقدر أرد بحرية بدون قوالب ثابتة.'
    return `🧪 رد تجريبي (المساعد الحقيقي غير مُعدّ بعد):\n${fallback}`
  }
}
