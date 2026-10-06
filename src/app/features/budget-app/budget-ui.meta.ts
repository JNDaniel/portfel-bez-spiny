import {
  ExpenseCategory,
  ExpenseClassification,
  ExpenseTag,
} from '../../core/models/finance.model';

export const CLASSIFICATION_META: Record<
  ExpenseClassification,
  { label: string; pluralLabel: string; color: string; badgeClass: string; activeClass: string }
> = {
  everyday: {
    label: 'Codzienny',
    pluralLabel: 'Codzienne',
    color: '#34d399',
    badgeClass: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40',
    activeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50',
  },
  want: {
    label: 'Zachcianka',
    pluralLabel: 'Zachcianki',
    color: '#fbbf24',
    badgeClass: 'bg-amber-950/70 text-amber-400 border-amber-500/40',
    activeClass: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
  },
  occasional: {
    label: 'Okazjonalny',
    pluralLabel: 'Okazjonalne',
    color: '#a78bfa',
    badgeClass: 'bg-violet-950/70 text-violet-300 border-violet-500/40',
    activeClass: 'bg-violet-950/80 text-violet-300 border-violet-500/50',
  },
};

export const TAG_META: Record<ExpenseTag, { badgeClass: string; activeClass: string }> = {
  Cykliczne: {
    badgeClass: 'bg-blue-950/70 text-blue-400 border-blue-500/40',
    activeClass: 'bg-blue-950/80 text-blue-400 border-blue-500/50',
  },
  Służbowe: {
    badgeClass: 'bg-indigo-950/70 text-indigo-400 border-indigo-500/40',
    activeClass: 'bg-indigo-950/80 text-indigo-400 border-indigo-500/50',
  },
  Spożywcze: {
    badgeClass: 'bg-teal-950/70 text-teal-400 border-teal-500/40',
    activeClass: 'bg-teal-950/80 text-teal-400 border-teal-500/50',
  },
};

export const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  Mieszkanie: '🏠',
  Jedzenie: '☕',
  Transport: '🚗',
  Zakupy: '🛍️',
  Zdrowie: '❤️',
  Rozrywka: '🎵',
  Media: '⚡',
  Inne: '💳',
};
