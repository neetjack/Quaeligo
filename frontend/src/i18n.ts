import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 使用 Vite 的 import.meta.glob 自动加载 locales 目录下的所有 ts 文件
const modules = import.meta.glob('./locales/*.ts', { eager: true });
const resources: Record<string, { translation: any }> = {};

for (const path in modules) {
  // 解析路径得到语言代码，例如 './locales/en.ts' -> 'en'
  const lang = path.match(/\/([^/]+)\.ts$/)?.[1];
  if (lang) {
    // @ts-ignore
    resources[lang] = { translation: modules[path].default };
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: "ja",
  fallbackLng: "en", // 默认回退到英文
  interpolation: { escapeValue: false }
});

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
