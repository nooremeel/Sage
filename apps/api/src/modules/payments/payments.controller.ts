import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  OrderSubject,
  type CurrentUser,
} from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout/:courseId')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', OrderSubject))
  @ApiOperation({ summary: 'Create checkout session for a course purchase' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async createCheckout(
    @User() user: CurrentUser,
    @Param('courseId') courseId: string,
    @Body() body?: { couponCode?: string },
  ) {
    const session = await this.paymentsService.createCheckoutSession(
      user.id,
      {
        courseId,
        couponCode: body?.couponCode,
      },
      user.locale || 'en',
    );
    return { session };
  }

  @Get('orders/:orderId')
  @CheckPolicies((ability) => ability.can('read', OrderSubject))
  @ApiOperation({ summary: 'Get order details for checkout review' })
  async getOrder(
    @User() user: CurrentUser,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.paymentsService.getOrder(orderId, user.id);
    return { order };
  }

  @Post('orders/:orderId/cancel')
  @CheckPolicies((ability) => ability.can('update', OrderSubject))
  @ApiOperation({ summary: 'Cancel a pending checkout order' })
  async cancelOrder(
    @User() user: CurrentUser,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.cancelOrder(orderId, user.id);
  }

  @Post('orders/:orderId/simulate')
  @CheckPolicies((ability) => ability.can('update', OrderSubject))
  @ApiOperation({ summary: 'Simulate payment success or failure in sandbox' })
  async simulatePayment(
    @Param('orderId') orderId: string,
    @Body() body: { action: 'pay' | 'fail' },
  ) {
    return this.paymentsService.simulateAction(orderId, body.action);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive signed payment gateway webhook' })
  async handleWebhook(
    @Headers('x-signature') signature: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    // If rawBody is available or serialize body object to JSON string
    const rawPayload =
      (req as any).rawBody || (typeof body === 'string' ? body : JSON.stringify(body));

    return this.paymentsService.processWebhook(rawPayload, signature);
  }
}
