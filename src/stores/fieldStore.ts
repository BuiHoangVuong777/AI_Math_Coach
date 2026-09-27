import { create } from 'zustand';
import { FieldNode, FilterMode, CATEGORY_TO_FILTER_GROUP, getLocalizedText, normalizeLanguage } from '@/types';
import i18n from '../i18n/index';
import { fieldsData } from '@/data/fields';

/** 纯函数：根据 filterMode 过滤字段列表 */
export function getFilteredFields(fields: FieldNode[], filterMode: FilterMode): FieldNode[] {
  if (filterMode === 'all') return fields;
  const isGroupMode = filterMode.endsWith('-group');
  return fields.filter(f => {
    if (isGroupMode) {
      return f.tags.some(tag => CATEGORY_TO_FILTER_GROUP[tag] === filterMode);
    }
    return f.tags.includes(filterMode);
  });
}

interface FieldStore {
  // 状态
  fields: FieldNode[];
  selectedField: FieldNode | null;
  hoveredField: FieldNode | null;
  filterMode: FilterMode;
  searchQuery: string;
  language: 'zh' | 'en' | 'vi';
  isDetailOpen: boolean;
  isAutoRotating: boolean;
  cameraTarget: [number, number, number] | null;

  // 操作
  setSelectedField: (field: FieldNode | null) => void;
  setHoveredField: (field: FieldNode | null) => void;
  setFilterMode: (mode: FilterMode) => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (lang: 'zh' | 'en' | 'vi') => void;
  setDetailOpen: (open: boolean) => void;
  setCameraTarget: (target: [number, number, number] | null) => void;
  setAutoRotating: (active: boolean) => void;

  // 计算属性
  searchFields: (query: string) => FieldNode[];
}

export const useFieldStore = create<FieldStore>((set, get) => ({
  // 初始状态
  fields: fieldsData,
  selectedField: null,
  hoveredField: null,
  filterMode: 'all',
  searchQuery: '',
  language: 'vi',
  isDetailOpen: false,
  isAutoRotating: true,
  cameraTarget: null,
  
  // 操作
  setSelectedField: (field) => set({ 
    selectedField: field,
    isDetailOpen: field !== null,
    isAutoRotating: field === null,
  }),
  
  setHoveredField: (field) => set({ hoveredField: field }),
  
  setFilterMode: (mode) => set({ filterMode: mode }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setLanguage: (lang) => { void i18n.changeLanguage(lang); },
  
  setDetailOpen: (open) => set({ 
    isDetailOpen: open,
    selectedField: open ? get().selectedField : null,
    isAutoRotating: !open,
    cameraTarget: open ? get().cameraTarget : null,
  }),
  
  setCameraTarget: (target) => set({ cameraTarget: target }),
  
  setAutoRotating: (active) => set({ isAutoRotating: active }),
  
  // 计算属性
  searchFields: (query) => {
    const { fields, language } = get();
    if (!query.trim()) return fields;
    const lowerQuery = query.toLowerCase();
    return fields.filter(f => {
      const name = getLocalizedText(f.names, language).toLowerCase();
      const desc = getLocalizedText(f.descriptions, language).toLowerCase();
      return name.includes(lowerQuery) || desc.includes(lowerQuery);
    });
  },
}));

// i18next is the single source of language changes; the store serves graph consumers.
i18n.on('languageChanged', (language: string) => {
  useFieldStore.setState({ language: normalizeLanguage(language) });
});
