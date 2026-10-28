import { describe, it, expect, beforeAll } from 'vitest';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator.js';
import { CHECK_POLICIES_KEY } from '../../src/common/casl/check-policies.decorator.js';
import { AuthController } from '../../src/modules/auth/auth.controller.js';
import { UsersController } from '../../src/modules/users/users.controller.js';
import { HealthController } from '../../src/modules/health/health.controller.js';

describe('Deny-By-Default Authorization Guardrail', () => {
  const reflector = new Reflector();
  const controllers = [AuthController, UsersController, HealthController];

  it('asserts that every route in every controller explicitly declares either @Public() or @CheckPolicies()', () => {
    const unshieldedRoutes: string[] = [];

    for (const controller of controllers) {
      const prototype = controller.prototype;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (prop) =>
          prop !== 'constructor' &&
          typeof prototype[prop] === 'function',
      );

      // Check controller-level metadata
      const isControllerPublic = reflector.get<boolean>(IS_PUBLIC_KEY, controller);
      const controllerPolicies = reflector.get<unknown[]>(CHECK_POLICIES_KEY, controller);

      for (const methodName of methodNames) {
        const method = prototype[methodName];

        const isMethodPublic = reflector.get<boolean>(IS_PUBLIC_KEY, method);
        const methodPolicies = reflector.get<unknown[]>(CHECK_POLICIES_KEY, method);

        const isPublic = isControllerPublic || isMethodPublic;
        const hasPolicies =
          (controllerPolicies && controllerPolicies.length > 0) ||
          (methodPolicies && methodPolicies.length > 0);

        if (!isPublic && !hasPolicies) {
          unshieldedRoutes.push(`${controller.name}.${methodName}`);
        }
      }
    }

    expect(
      unshieldedRoutes,
      `The following routes violate the Deny-By-Default policy: [${unshieldedRoutes.join(', ')}]`,
    ).toEqual([]);
  });
});
