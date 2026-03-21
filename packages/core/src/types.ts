import type { ZodType } from 'zod'

export type FieldType = 'string' | 'number' | 'boolean' | 'url' | 'port' | 'email' | 'enum'

export interface FieldDescriptor {
  type: FieldType
  required?: boolean
  default?: string | number | boolean
  description?: string
  sensitive?: boolean
  values?: string[]
  validate?: ZodType
}

export type Schema = Record<string, FieldDescriptor>

export interface ValidationFailure {
  variable: string
  reason: string
}

export function formatErrors(failures: ValidationFailure[]): string {
  const lines = failures.map((f) => `  ${f.variable}: ${f.reason}`).join('\n')
  return `EnvGuard validation failed (${failures.length} error${failures.length === 1 ? '' : 's'}):\n${lines}`
}

export class EnvValidationError extends Error {
  readonly failures: ValidationFailure[]

  constructor(failures: ValidationFailure[]) {
    super(formatErrors(failures))
    this.name = 'EnvValidationError'
    this.failures = failures
  }
}

export type InferFieldType<F extends FieldDescriptor> =
  F['type'] extends 'number' | 'port' ? number :
  F['type'] extends 'boolean' ? boolean :
  F['type'] extends 'enum' ? F['values'] extends string[] ? F['values'][number] : string :
  string

export type EnvObject<S extends Schema> = {
  readonly [K in keyof S]: InferFieldType<S[K]>
}

export type SafeEnvObject<S extends Schema> = {
  readonly [K in keyof S]: string
}
