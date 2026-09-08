import { fileURLToPath } from 'node:url'

export const ANALYSIS_OUTPUT_ROOT = fileURLToPath(new URL('../generated/analysis/', import.meta.url))
