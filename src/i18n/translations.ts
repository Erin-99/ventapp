export const translations = {
  zh: {
    title: '一起吐槽吧',
    placeholder: '想吐槽点什么？',
    submit: '开始吐槽',
    loading: '正在思考...',
    error: '抱歉，我现在有点累，晚点再聊？',
    switchLanguage: 'Switch to English'
  },
  en: {
    title: "Let's Vent Together",
    placeholder: "What's bothering you?",
    submit: 'Vent Now',
    loading: 'Thinking...',
    error: "Sorry, I'm a bit tired. Chat later?",
    switchLanguage: '切换到中文'
  }
} as const;

export type Language = keyof typeof translations;

export type TranslationKey = keyof typeof translations.zh;
