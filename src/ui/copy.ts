/**
 * Every user-facing string in the app (ADR-0008). Spanish only — nothing user-facing lives
 * outside this file, and nothing English belongs in it.
 */
export const copy = {
  appName: 'Reps',
  tagline: 'Una lección por día.',

  lessonLabel: 'Lección',
  reviewBadge: 'Repaso',
  progress: (current: number, total: number): string => `${current} / ${total}`,

  reveal: 'Ver respuesta',
  gradePrompt: '¿Cómo te fue?',
  grades: {
    1: 'Otra vez',
    2: 'Difícil',
    3: 'Bien',
    4: 'Fácil',
  },

  sourceLabel: 'Fuente',
  sourceBy: 'por',

  endTitle: 'Lección completada',
  endSubtitle: 'Eso es todo por hoy.',
  restart: 'Empezar de nuevo',

  noLesson: 'No hay ninguna lección para mostrar.',
} as const
