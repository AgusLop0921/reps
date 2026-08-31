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
  landingNavSystem: 'Sistema',
  landingEyebrowRight: 'Basado en preguntas-entrevista-react',
  landingLead:
    'Ocupa el lugar del scroll: abrís, hacés tres tarjetas de React, y se acaba. No hay feed que siga.',
  landingCta: 'Empezar la lección 1',
  landingCtaNote: 'Sin cuenta, sin configuraciones. Tu progreso queda en este navegador.',
  landingHowEyebrow: 'Cómo funciona',
  landingHowEyebrowRight: 'Orden, no algoritmo',
  landingPoints: [
    {
      title: 'Lecciones que terminan',
      body: 'Tres tarjetas nuevas, un repaso y una pregunta. Al final no hay un "siguiente" infinito: la tanda se termina, y eso es todo.',
    },
    {
      title: 'Camino ordenado',
      body: 'Un camino lineal, de lo básico a lo avanzado. No elegís temas al azar: te deja donde quedaste y sigue desde ahí.',
    },
    {
      title: 'Las preguntas vuelven',
      body: 'Repaso espaciado: lo que viste reaparece justo antes de que se te olvide, mezclado con la lección nueva.',
    },
  ],
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
