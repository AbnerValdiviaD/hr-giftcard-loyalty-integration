import {
  CommercetoolsCartService,
  CommercetoolsOrderService,
  CommercetoolsPaymentService,
  ErrorInvalidOperation,
} from '@commercetools/connect-payments-sdk';
import {
  CancelPaymentRequest,
  CapturePaymentRequest,
  ModifyPayment,
  PaymentProviderModificationResponse,
  RefundPaymentRequest,
  ReversePaymentRequest,
  StatusResponse,
} from './types/operation.type';
import { PaymentIntentResponseSchemaDTO } from '../dtos/operations/payment-intents.dto';
import { BalanceResponseSchemaDTO, RedeemRequestDTO, RedeemResponseDTO } from '../dtos/giftcard.dto';

export abstract class AbstractGiftCardService {
  protected ctCartService: CommercetoolsCartService;
  protected ctPaymentService: CommercetoolsPaymentService;
  protected ctOrderService: CommercetoolsOrderService;

  constructor(
    ctCartService: CommercetoolsCartService,
    ctPaymentService: CommercetoolsPaymentService,
    ctOrderService: CommercetoolsOrderService,
  ) {
    this.ctCartService = ctCartService;
    this.ctPaymentService = ctPaymentService;
    this.ctOrderService = ctOrderService;
  }

  /**
   * Get stats information
   * @returns
   */
  abstract status(): Promise<StatusResponse>;

  /**
   * Validate Code and return balance
   * @param code - Gift card code/number
   * @param securityCode - Optional security code/PIN
   * @returns
   */
  abstract balance(code: string, securityCode?: string): Promise<BalanceResponseSchemaDTO>;

  /**
   * Redeem Code
   * @param request - Redeem request with code, amount, and optional security code
   * @param fastifyRequest - Optional Fastify request object for extracting metadata
   * @returns
   */
  abstract redeem(request: RedeemRequestDTO, fastifyRequest?: any): Promise<RedeemResponseDTO>;

  /**
   * Remove payment from cart and delete payment object
   * @param paymentId - Payment ID to remove
   * @returns
   */
  abstract removePayment(paymentId: string): Promise<void>;

  /**
   * Capture payment
   * @param request
   * @returns
   */
  abstract capturePayment(request: CapturePaymentRequest): Promise<PaymentProviderModificationResponse>;

  /**
   * Cancel payment
   * @param request
   * @returns
   */
  abstract cancelPayment(request: CancelPaymentRequest): Promise<PaymentProviderModificationResponse>;

  /**
   * Refund payment
   * @param request
   * @returns
   */
  abstract refundPayment(request: RefundPaymentRequest): Promise<PaymentProviderModificationResponse>;

  /**
   * Reverse payment
   *
   * @remarks
   * Abstract method to execute payment reversals in support of automated reversals to be triggered by checkout api. The actual invocation to PSPs should be implemented in subclasses
   *
   * @param request
   * @returns Promise with outcome containing operation status and PSP reference
   */
  abstract reversePayment(request: ReversePaymentRequest): Promise<PaymentProviderModificationResponse>;

  public async modifyPayment(opts: ModifyPayment): Promise<PaymentIntentResponseSchemaDTO> {
    const ctPayment = await this.ctPaymentService.getPayment({
      id: opts.paymentId,
    });

    // Query order by payment ID
    let orderId: string | undefined;
    try {
      const order = await this.ctOrderService.getOrderByPaymentId({
        paymentId: opts.paymentId,
      });
      if (order) {
        orderId = order.orderNumber;
      }
    } catch (error) {
      // Order not found - this is OK during authorization phase
    }

    const request = opts.data.actions[0];

    switch (request.action) {
      case 'cancelPayment': {
        return await this.cancelPayment({
          payment: ctPayment,
          merchantReference: request.merchantReference,
          orderId: request.orderId || orderId,
        });
      }
      case 'capturePayment': {
        return await this.capturePayment({
          payment: ctPayment,
          merchantReference: request.merchantReference,
          amount: request.amount,
          orderId: request.orderId || orderId,
        });
      }
      case 'refundPayment': {
        return await this.refundPayment({
          amount: request.amount,
          payment: ctPayment,
          merchantReference: request.merchantReference,
          transactionId: request.transactionId,
          orderId: request.orderId || orderId,
        });
      }
      case 'reversePayment': {
        return await this.reversePayment({
          payment: ctPayment,
          merchantReference: request.merchantReference,
          orderId: request.orderId || orderId,
        });
      }
      default: {
        throw new ErrorInvalidOperation('Operation not supported.');
      }
    }
  }
}
