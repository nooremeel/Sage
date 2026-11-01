import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../src/common/decorators/public.decorator.js';
import { CHECK_POLICIES_KEY } from '../../src/common/casl/check-policies.decorator.js';
import { AuthController } from '../../src/modules/auth/auth.controller.js';
import { UsersController } from '../../src/modules/users/users.controller.js';
import { HealthController } from '../../src/modules/health/health.controller.js';
import { CategoriesController } from '../../src/modules/categories/categories.controller.js';
import { CoursesController } from '../../src/modules/courses/courses.controller.js';
import { CurriculumController } from '../../src/modules/curriculum/curriculum.controller.js';
import { MediaController } from '../../src/modules/media/media.controller.js';
import { EnrollmentsController } from '../../src/modules/enrollments/enrollments.controller.js';
import { ProgressController } from '../../src/modules/progress/progress.controller.js';
import { QuizzesController } from '../../src/modules/quizzes/quizzes.controller.js';
import { RealtimeController } from '../../src/modules/realtime/realtime.controller.js';
import { NotificationsController } from '../../src/modules/notifications/notifications.controller.js';
import { QAController } from '../../src/modules/qa/qa.controller.js';
import { CertificatesController } from '../../src/modules/certificates/certificates.controller.js';
import { ReviewsController } from '../../src/modules/reviews/reviews.controller.js';
import { AnalyticsController } from '../../src/modules/analytics/analytics.controller.js';
import { PaymentsController } from '../../src/modules/payments/payments.controller.js';
import { MetricsController } from '../../src/modules/metrics/metrics.controller.js';
import { AdminController } from '../../src/modules/admin/admin.controller.js';

describe('Deny-By-Default Authorization Guardrail', () => {
  const reflector = new Reflector();
  const controllers = [
    AuthController,
    UsersController,
    HealthController,
    CategoriesController,
    CoursesController,
    CurriculumController,
    MediaController,
    EnrollmentsController,
    ProgressController,
    QuizzesController,
    RealtimeController,
    NotificationsController,
    QAController,
    CertificatesController,
    ReviewsController,
    AnalyticsController,
    PaymentsController,
    MetricsController,
    AdminController,
  ];

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
