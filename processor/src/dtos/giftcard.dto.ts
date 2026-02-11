import { Static, Type } from '@sinclair/typebox';
import { AmountSchema } from './operations/payment-intents.dto';

export const ErrorSchema = Type.Object({
  code: Type.String(),
  message: Type.String(),
});

const StatusSchema = Type.Object({
  state: Type.String(),
  errors: Type.Optional(Type.Array(ErrorSchema)),
});

export const BalanceResponseSchema = Type.Object({
  status: StatusSchema,
  amount: Type.Optional(AmountSchema),
});

export const RedeemRequestSchema = Type.Object({
  code: Type.String(),
  securityCode: Type.Optional(Type.String()),
  amount: AmountSchema,
});

export const RedeemResponseSchema = Type.Object({
  isSuccess: Type.Boolean(),
  paymentReference: Type.Optional(Type.String()),
  errorMessage: Type.Optional(Type.String()),
});

export const BalanceRequestSchema = Type.Object({
  code: Type.String(),
  securityCode: Type.Optional(Type.String()),
});

export type RedeemRequestDTO = Static<typeof RedeemRequestSchema>;
export type RedeemResponseDTO = Static<typeof RedeemResponseSchema>;
export type BalanceRequestSchemaDTO = Static<typeof BalanceRequestSchema>;
export type BalanceResponseSchemaDTO = Static<typeof BalanceResponseSchema>;
