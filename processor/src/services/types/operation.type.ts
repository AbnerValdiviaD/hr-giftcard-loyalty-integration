import {
  AmountSchemaDTO,
  PaymentIntentRequestSchemaDTO,
  PaymentModificationStatus,
} from '../../dtos/operations/payment-intents.dto';
import { StatusResponseSchemaDTO } from '../../dtos/operations/status.dto';
import { Payment } from '@commercetools/connect-payments-sdk';

export type CapturePaymentRequest = {
  amount: AmountSchemaDTO;
  payment: Payment;
  merchantReference?: string;
  orderId?: string;
};

export type CancelPaymentRequest = {
  payment: Payment;
  merchantReference?: string;
  orderId?: string;
};

export type RefundPaymentRequest = {
  amount: AmountSchemaDTO;
  payment: Payment;
  merchantReference?: string;
  transactionId?: string;
  orderId?: string;
};

export type ReversePaymentRequest = {
  payment: Payment;
  merchantReference?: string;
  orderId?: string;
};

export type PaymentProviderModificationResponse = {
  outcome: PaymentModificationStatus;
  pspReference: string;
};

export type StatusResponse = StatusResponseSchemaDTO;

export type ModifyPayment = {
  paymentId: string;
  data: PaymentIntentRequestSchemaDTO;
};
