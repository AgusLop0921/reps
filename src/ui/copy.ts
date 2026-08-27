/**
 * Every user-facing string in the app (ADR-0008). Spanish only — nothing user-facing lives
 * outside this file, and nothing English belongs in it. Voice: Rioplatense (voseo).
 */
export const copy = {
  appName: 'Reps',
  tagline: 'React en tarjetas cortas. Tres por día, cuatro minutos, y se termina.',

  loading: 'Cargando…',

  // First-run account choice (ADR-0021). Honest, symmetric, no default. Shown once, ever.
  onboardingTitle: 'Antes de empezar',
  onboardingBody:
    'Con una cuenta, tu progreso se guarda y te sigue entre dispositivos. Sin cuenta, queda en este navegador.',
  onboardingEmail: 'Entrar con email',
  onboardingSkip: 'Seguir sin cuenta',
  onboardingBack: 'Volver',
  onboardingStart: 'Empezar',

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
  // The next lesson is announced so curiosity pulls the next tap, never the app (ADR-0018).
  endNextKicker: 'Lo que sigue',
  endNext: 'Empezar la próxima',
  endMissedTitle: 'Para repasar',
  restart: 'Empezar de nuevo',

  pathBack: 'Ver el camino',
  pathTitle: 'El camino',
  sectionProgress: (done: number, total: number): string => `${done} de ${total}`,
  sectionEnter: 'Empezar acá',
  pathCurrent: 'acá',
  // A done lesson is a fact, not a reward — a quiet mark, never a badge to collect (ADR-0018).
  lessonDoneMark: '✓',
  lessonDoneLabel: 'Lección terminada',

  // Export/import is the only mitigation for per-browser data (ADR-0005).
  exportProgress: 'Exportar progreso',
  importProgress: 'Importar progreso',
  importDone: 'Progreso importado.',
  importError: 'No se pudo importar el archivo.',

  // Cross-device sync (ADR-0020, ADR-0021). One affordance, never a nag (ADR-0018).
  syncTitle: 'Sincronizar entre dispositivos',
  googleSignIn: 'Continuar con Google',
  syncEmailPlaceholder: 'tu correo',
  syncSend: 'Enviarme el enlace',
  syncCheckEmail: 'Te mandamos un enlace. Revisá tu correo.',
  syncError: 'No se pudo enviar el enlace. Probá de nuevo.',
  syncedAs: (email: string): string => `Sincronizado como ${email}`,
  signOut: 'Cerrar sesión',
  deleteAccount: 'Eliminar cuenta',
  deleteConfirm: '¿Eliminar tu cuenta y todo tu progreso? No se puede deshacer.',
  accountDeleted: 'Cuenta eliminada.',
  syncPrivacy: 'Guardamos solo tu progreso: cajas, fechas y posición. Nunca el contenido ni tus respuestas.',

  noLesson: 'No hay ninguna lección para mostrar.',
} as const
