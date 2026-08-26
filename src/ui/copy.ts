/**
 * Every user-facing string in the app (ADR-0008). Spanish only — nothing user-facing lives
 * outside this file, and nothing English belongs in it. Voice: Rioplatense (voseo).
 */
export const copy = {
  appName: 'Reps',
  tagline: 'React en tarjetas cortas. Tres por día, cuatro minutos, y se termina.',

  lessonLabel: 'Lección',
  reviewBadge: 'Repaso',
  cardCount: (current: number, total: number): string => `${current}/${total}`,

  verdictRight: 'Correcto',
  verdictWrong: 'Casi',
  correctMark: '✓',
  yourAnswer: 'tu respuesta',

  nextCard: (next: number, total: number): string => `Tarjeta ${next} de ${total}`,
  finishLesson: 'Terminar la lección',

  // Attribution for the imported question/answer (ADR-0007). The generated check has none
  // — it is ours, not the source's (ADR-0017).
  sourcePrefix: 'Contenido de',

  endDone: 'terminada',
  endTitle: 'Listo.',
  // The lesson is done; the next one is right there and stopping is equally fine — no
  // "come back tomorrow", no "nothing left to do". Continuation is pulled by the content,
  // never pushed by the app (ADR-0018).
  endSubtitle: 'Seguí si te interesa lo que viene, o dejalo acá. Las dos están bien.',
  endSubtitleLast: 'Llegaste al final del camino por ahora.',
  endNextKicker: 'Lo que sigue',
  endNext: 'Empezar la próxima',
  endMissedTitle: 'Para repasar',
  restart: 'Empezar de nuevo',

  pathBack: 'Ver el camino',
  pathTitle: 'El camino',
  sectionProgress: (done: number, total: number): string => `${done} de ${total}`,
  sectionEnter: 'Empezar acá',
  pathCurrent: 'acá',

  noLesson: 'No hay ninguna lección para mostrar.',
} as const
