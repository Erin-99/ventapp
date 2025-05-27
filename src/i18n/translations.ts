export const translations = {
  zh: {
    title: '一起吐槽吧',
    inputPlaceholder: '想吐槽点什么？',
    submitButton: '开始吐槽',
    thinking: '正在思考...',
    errorMessage: '抱歉，我现在有点累，晚点再聊？',
    historyTitle: '历史记录',
    languageSwitch: 'Switch to English'
  },
  en: {
    title: "Let's Vent Together",
    inputPlaceholder: "What's bothering you?",
    submitButton: 'Vent Now',
    thinking: 'Thinking...',
    errorMessage: "Sorry, I'm a bit tired. Chat later?",
    historyTitle: 'History',
    languageSwitch: '切换到中文'
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
