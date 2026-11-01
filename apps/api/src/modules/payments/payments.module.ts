import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { FakePaymentProvider } from './fake-payment.provider.js';
import { PAYMENT_PROVIDER } from './payment-provider.interface.js';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      useClass: FakePaymentProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}

