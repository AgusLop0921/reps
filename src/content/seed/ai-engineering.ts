import { checkSchema, questionSchema, trackSchema } from '../schema'

/**
 * Tiny editorial seed used only to prove the second track end to end. It is deliberately
 * attributed to Reps, not Microsoft: no Microsoft content was fetched or reproduced here.
 */
export const aiEngineeringQuestion = questionSchema.parse({
  id: 'a8021d760393',
  sourceId: 'reps-manual',
  slug: 'what-is-an-llm',
  sourceSection: 'Fundamentos',
  tech: 'ai',
  lang: 'es',
  level: 'basic',
  topic: 'LLM',
  format: 'open',
  question: '¿Qué es un LLM?',
  answerMd:
    'Un **modelo de lenguaje grande (LLM)** es un modelo entrenado con grandes cantidades de texto para reconocer patrones del lenguaje y generar respuestas a partir de una entrada.',
})

export const aiEngineeringCheck = checkSchema.parse({
  questionId: aiEngineeringQuestion.id,
  stem: '¿Qué describe mejor a un LLM?',
  options: [
    {
      text: 'Un modelo que reconoce patrones del lenguaje y genera respuestas desde una entrada',
      correct: true,
    },
    { text: 'Una base de datos que guarda respuestas escritas de antemano', correct: false },
    { text: 'Un protocolo para conectar herramientas externas', correct: false },
  ],
  explanation:
    'Un LLM aprende patrones del lenguaje durante su entrenamiento y los usa para producir una respuesta según la entrada que recibe.',
})

export const aiEngineeringTrack = trackSchema.parse({
  id: 'ai-engineering',
  title: 'AI Engineering',
  description: 'LLMs, RAG, tools, agentes y sistemas que llegan a producción.',
  sourceReferences: [
    { sourceId: 'microsoft-generative-ai-for-beginners' },
    { sourceId: 'reps-manual' },
  ],
  curriculum: {
    generatedAt: '2026-09-08T00:00:00.000Z',
    sections: [
      {
        id: 'ai-engineering:fundamentals',
        title: 'Fundamentos',
        sourceId: 'reps-manual',
        lessons: [
          {
            id: 'ai-engineering:fundamentals:1',
            order: 1,
            questionIds: [aiEngineeringQuestion.id],
          },
        ],
      },
    ],
  },
})
