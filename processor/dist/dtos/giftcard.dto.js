"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceRequestSchema = exports.RedeemResponseSchema = exports.RedeemRequestSchema = exports.BalanceResponseSchema = exports.ErrorSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
const payment_intents_dto_1 = require("./operations/payment-intents.dto");
exports.ErrorSchema = typebox_1.Type.Object({
    code: typebox_1.Type.String(),
    message: typebox_1.Type.String(),
});
const StatusSchema = typebox_1.Type.Object({
    state: typebox_1.Type.String(),
    errors: typebox_1.Type.Optional(typebox_1.Type.Array(exports.ErrorSchema)),
});
exports.BalanceResponseSchema = typebox_1.Type.Object({
    status: StatusSchema,
    amount: typebox_1.Type.Optional(payment_intents_dto_1.AmountSchema),
});
exports.RedeemRequestSchema = typebox_1.Type.Object({
    code: typebox_1.Type.String(),
    securityCode: typebox_1.Type.Optional(typebox_1.Type.String()),
    amount: payment_intents_dto_1.AmountSchema,
});
exports.RedeemResponseSchema = typebox_1.Type.Object({
    isSuccess: typebox_1.Type.Boolean(),
    paymentReference: typebox_1.Type.Optional(typebox_1.Type.String()),
    errorMessage: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.BalanceRequestSchema = typebox_1.Type.Object({
    code: typebox_1.Type.String(),
    securityCode: typebox_1.Type.Optional(typebox_1.Type.String()),
});
