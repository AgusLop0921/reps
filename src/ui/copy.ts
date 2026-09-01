/**
 * Every user-facing string in the app (ADR-0008). Spanish only — nothing user-facing lives
 * outside this file, and nothing English belongs in it. Voice: Rioplatense (voseo).
 */
export const copy = {
  appName: 'Reps',
  tagline: 'React en tarjetas cortas. Tres por día, cuatro minutos, y se termina.',

  loading: 'Cargando…',

  // Landing — "Diagonal" direction (ADR-0021). First-run and revisitable. Body copy is
  // transcribed from the design prototype (to refine); the credit interpolates
  // author/name/url/license from sources.ts (ADR-0007), never hardcoded.
  landingNavStart: 'Empezar',
  landingNavHow: 'Cómo funciona',
  // Hero eyebrow: the scale as a fact (count derived from the data), then a quieter source line.
  landingScale: (count: number): string => `${count} preguntas reales de entrevistas de React.`,
  landingScaleSub: 'Basadas en el contenido de midudev · Gratis · En español.',
  // The hero's main line and its supporting description.
  landingLead: 'Entrená React en vez de scrollear.',
  landingWhy:
    'Preguntas reales de entrevista, explicaciones y repasos en sesiones de pocos minutos.',
  landingCta: 'Empezar a practicar',
  // Two notes: with sync available there's a real choice (account or not); without it,
  // there's no account to offer, so only the local-only line is true.
  landingCtaNote: 'Sin cuenta, tu progreso queda en este navegador.',
  landingCtaNoteSync:
    'Sin cuenta podés empezar ahora. Con cuenta, tu progreso te acompaña en cualquier dispositivo.',
  landingHowEyebrow: 'Cómo funciona',
  landingPoints: [
    {
      title: 'Aprendé de a poco',
      body: 'Cada sesión tiene pocas preguntas. Lo suficiente para avanzar sin convertirlo en otra cosa que dejás para después.',
    },
    {
      title: 'Seguí donde quedaste',
      body: 'No tenés que elegir qué estudiar. Reps organiza el recorrido y te lleva a la próxima lección.',
    },
    {
      title: 'Recordá de verdad',
      body: 'Las preguntas vuelven con el tiempo para reforzar lo aprendido justo cuando empezás a olvidarlo.',
    },
  ],
  // "Cómo funciona": the lesson row describes a lesson; the training row keeps the numbered
  // points. Eyebrows label each row against its screenshot.
  landingShotQuestion: 'Una lección',
  landingShotTrail: 'Tu entrenamiento',
  landingQuestionTitle: 'Una lección. Pocos minutos.',
  landingQuestionBody:
    'Primero entendés el concepto con una explicación y ejemplos. Después lo ponés a prueba con preguntas reales de entrevista.',
  landingQuestionBody2: 'Respondés, entendés por qué y seguís. Sin sesiones eternas.',
  // Closing section, before the credit. The remate gets typographic weight, not a second hero.
  landingCloseTitle: 'No necesitás una hora libre.',
  landingCloseBody:
    'Cinco minutos esperando el colectivo, tomando un café o antes de arrancar a trabajar alcanzan para hacer una lección.',
  landingCloseRemate: 'Menos scroll. Una rep más.',
  landingCreditEyebrow: 'Crédito del contenido',
  landingCreditPre: (author: string): string =>
    `Las preguntas y respuestas son de ${author}, del repositorio `,
  landingCreditPost: (license: string): string => `, con licencia ${license}.`,
  landingCreditNote:
    'Solo agregamos la capa de práctica. Los tests de opción múltiple los generamos nosotros; no son parte del contenido original.',
  landingFooterMeta: (author: string, license: string): string =>
    `Contenido de ${author} · ${license}`,

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
  pathHome: 'Ir al inicio',
  sectionProgress: (done: number, total: number): string => `${done} de ${total}`,
  lessonDoneLabel: 'Lección terminada',

  // Learning-path trail (Phase 1). One section per screen, paged; state carries node shape.
  prevSection: 'Sección anterior',
  nextSection: 'Sección siguiente',
  nodeStateLabel: { done: 'terminada', current: 'actual', locked: 'bloqueada' },
  sectionDone: 'Sección terminada',
  sectionDoneTitle: (name: string): string => `${name}, listo.`,
  sectionDoneNote: 'Lo de esta sección vuelve más adelante, mezclado con lo nuevo.',
  openNextSection: (name: string): string => `Abrir ${name}`,

  // Theme toggle: a single icon showing the theme you'd switch to (sun in dark, moon in
  // light). The words are the accessible labels; the glyphs are the monochrome icons.
  themeOptions: { dark: 'Oscuro', light: 'Claro' },
  themeGlyphs: { dark: '☾', light: '☼' },

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
