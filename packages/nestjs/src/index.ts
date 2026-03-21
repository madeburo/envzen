import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { createEnv } from 'envzen-core'
import type { Schema } from 'envzen-core'

@Module({})
export class EnvGuardModule {
  /**
   * Registers EnvGuardModule and validates the schema during NestJS bootstrap.
   * Throws an EnvValidationError (via createEnv) if validation fails,
   * preventing the application from starting.
   */
  static forRoot(schema: Schema): DynamicModule {
    // Delegate all validation to core — throws EnvValidationError on failure
    createEnv(schema)

    return {
      module: EnvGuardModule,
      global: true,
    }
  }
}
