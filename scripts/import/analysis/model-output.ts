import { z } from 'zod'
import { difficultyHintSchema, relationshipTypeSchema } from './source-analysis'

const modelDifficultySchema = z.union([difficultyHintSchema, z.literal('unknown')])

export const modelEvidenceSchema = z.object({
  heading: z.string(),
  excerpt: z.string().min(1).max(500),
})

const modelDetailSchema = z.object({
  kind: z.enum(['example', 'distinction']),
  summary: z.string().min(1),
  evidence: z.array(modelEvidenceSchema).min(1),
})

export const extractedConceptSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  difficultyHint: modelDifficultySchema,
  evidence: z.array(modelEvidenceSchema).min(1),
  details: z.array(modelDetailSchema),
})

export const documentExtractionSchema = z.object({
  documentId: z.string().length(12),
  concepts: z.array(extractedConceptSchema),
})

const consolidatedEvidenceSchema = modelEvidenceSchema.extend({
  documentId: z.string().length(12),
})

const consolidatedDetailSchema = z.object({
  kind: z.enum(['example', 'distinction']),
  summary: z.string().min(1),
  evidence: z.array(consolidatedEvidenceSchema).min(1),
})

const consolidatedConceptSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  difficultyHint: modelDifficultySchema,
  evidence: z.array(consolidatedEvidenceSchema).min(1),
  details: z.array(consolidatedDetailSchema),
})

const consolidatedRelationshipSchema = z.object({
  type: relationshipTypeSchema,
  fromConceptName: z.string().min(1),
  toConceptName: z.string().min(1),
  evidence: z.array(consolidatedEvidenceSchema).min(1),
})

export const consolidationOutputSchema = z.object({
  concepts: z.array(consolidatedConceptSchema).min(1),
  relationships: z.array(consolidatedRelationshipSchema),
})

export type ModelEvidence = z.infer<typeof modelEvidenceSchema>
export type DocumentExtraction = z.infer<typeof documentExtractionSchema>
export type ConsolidationOutput = z.infer<typeof consolidationOutputSchema>

const EVIDENCE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['heading', 'excerpt'],
  properties: { heading: { type: 'string' }, excerpt: { type: 'string' } },
} as const

const DIFFICULTY_JSON_SCHEMA = {
  type: 'string',
  enum: ['introductory', 'intermediate', 'advanced', 'unknown'],
} as const

const DETAIL_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'summary', 'evidence'],
  properties: {
    kind: { type: 'string', enum: ['example', 'distinction'] },
    summary: { type: 'string' },
    evidence: { type: 'array', minItems: 1, items: EVIDENCE_JSON_SCHEMA },
  },
} as const

const EXTRACTED_CONCEPT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'summary', 'difficultyHint', 'evidence', 'details'],
  properties: {
    name: { type: 'string' },
    summary: { type: 'string' },
    difficultyHint: DIFFICULTY_JSON_SCHEMA,
    evidence: { type: 'array', minItems: 1, items: EVIDENCE_JSON_SCHEMA },
    details: { type: 'array', items: DETAIL_JSON_SCHEMA },
  },
} as const

export const DOCUMENT_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['documentId', 'concepts'],
  properties: {
    documentId: { type: 'string' },
    concepts: { type: 'array', items: EXTRACTED_CONCEPT_JSON_SCHEMA },
  },
} as const

const CONSOLIDATED_EVIDENCE_JSON_SCHEMA = {
  ...EVIDENCE_JSON_SCHEMA,
  required: ['documentId', 'heading', 'excerpt'],
  properties: { documentId: { type: 'string' }, ...EVIDENCE_JSON_SCHEMA.properties },
} as const

const CONSOLIDATED_DETAIL_JSON_SCHEMA = {
  ...DETAIL_JSON_SCHEMA,
  properties: {
    ...DETAIL_JSON_SCHEMA.properties,
    evidence: { type: 'array', minItems: 1, items: CONSOLIDATED_EVIDENCE_JSON_SCHEMA },
  },
} as const

export const CONSOLIDATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['concepts', 'relationships'],
  properties: {
    concepts: {
      type: 'array',
      minItems: 1,
      items: {
        ...EXTRACTED_CONCEPT_JSON_SCHEMA,
        properties: {
          ...EXTRACTED_CONCEPT_JSON_SCHEMA.properties,
          evidence: {
            type: 'array',
            minItems: 1,
            items: CONSOLIDATED_EVIDENCE_JSON_SCHEMA,
          },
          details: { type: 'array', items: CONSOLIDATED_DETAIL_JSON_SCHEMA },
        },
      },
    },
    relationships: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'fromConceptName', 'toConceptName', 'evidence'],
        properties: {
          type: {
            type: 'string',
            enum: ['prerequisite_of', 'related_to', 'part_of', 'contrasts_with'],
          },
          fromConceptName: { type: 'string' },
          toConceptName: { type: 'string' },
          evidence: {
            type: 'array',
            minItems: 1,
            items: CONSOLIDATED_EVIDENCE_JSON_SCHEMA,
          },
        },
      },
    },
  },
} as const
