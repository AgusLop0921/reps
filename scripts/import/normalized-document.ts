import { z } from 'zod'
import { sourceReferenceSchema } from '../../src/content/schema'

/**
 * Source-agnostic output of the ingestion stage described by ADR-0023.
 *
 * `contentMd` is source material normalized to Markdown, not published lesson content.
 * Repository-specific details stay inside the generic source reference.
 */
export const normalizedDocumentSchema = z.object({
  id: z.string().length(12),
  title: z.string().min(1),
  contentMd: z.string().min(1),
  sourceReference: sourceReferenceSchema,
  metadata: z
    .object({
      order: z.number().int().nonnegative().optional(),
      language: z.string().min(1).optional(),
    })
    .optional(),
})

/** A deterministic source snapshot. It deliberately has no generation timestamp. */
export const normalizedDocumentsFileSchema = z
  .object({
    schemaVersion: z.literal(1),
    sourceId: z.string().min(1),
    sourceRevision: z.string().min(1),
    documents: z.array(normalizedDocumentSchema).min(1),
  })
  .superRefine((snapshot, context) => {
    const ids = new Set<string>()
    snapshot.documents.forEach((document, index) => {
      if (ids.has(document.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate document id: ${document.id}`,
          path: ['documents', index, 'id'],
        })
      }
      ids.add(document.id)

      if (document.sourceReference.sourceId !== snapshot.sourceId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'document source does not match snapshot source',
          path: ['documents', index, 'sourceReference', 'sourceId'],
        })
      }
      if (document.sourceReference.sourceRevision !== snapshot.sourceRevision) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'document revision does not match snapshot revision',
          path: ['documents', index, 'sourceReference', 'sourceRevision'],
        })
      }
    })
  })

export type NormalizedDocument = z.infer<typeof normalizedDocumentSchema>
export type NormalizedDocumentsFile = z.infer<typeof normalizedDocumentsFileSchema>
