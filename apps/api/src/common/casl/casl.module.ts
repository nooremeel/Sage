import { Global, Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory.js';
import { PoliciesGuard } from './policies.guard.js';

@Global()
@Module({
  providers: [CaslAbilityFactory, PoliciesGuard],
  exports: [CaslAbilityFactory, PoliciesGuard],
})
export class CaslModule {}
