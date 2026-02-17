"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockGiftCardServiceRoutes = void 0;
const giftcard_dto_1 = require("../dtos/giftcard.dto");
const typebox_1 = require("@sinclair/typebox");
const payment_intents_dto_1 = require("../dtos/operations/payment-intents.dto");
/**
 * MockGiftCardServiceRoutes is used to expose endpoints for giftcard management. Since the required requests/responses/parameters may vary among different gift card service providers, here we provide sample routes for further customization.
 */
const mockGiftCardServiceRoutes = async (fastify, opts) => {
    fastify.post('/balance', {
        preHandler: [opts.sessionHeaderAuthHook.authenticate()],
        schema: {
            body: {
                type: 'object',
                properties: {
                    code: typebox_1.Type.String(),
                    securityCode: typebox_1.Type.Optional(typebox_1.Type.String()),
                },
                required: ['code'],
            },
            response: {
                200: giftcard_dto_1.BalanceResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { code, securityCode } = request.body;
        const res = await opts.giftCardService.balance(code, securityCode);
        return reply.status(200).send(res);
    });
    fastify.post('/redeem', {
        preHandler: [opts.sessionHeaderAuthHook.authenticate()],
        schema: {
            body: {
                type: 'object',
                properties: {
                    code: typebox_1.Type.String(),
                    securityCode: typebox_1.Type.Optional(typebox_1.Type.String()),
                    amount: payment_intents_dto_1.AmountSchema,
                },
                required: ['code', 'amount'],
            },
            response: {
                200: giftcard_dto_1.RedeemResponseSchema,
            },
        },
    }, async (request, reply) => {
        const res = await opts.giftCardService.redeem(request.body);
        return reply.status(200).send(res);
    });
    fastify.delete('/payment/:paymentId', {
        preHandler: [opts.sessionHeaderAuthHook.authenticate()],
        schema: {
            params: {
                type: 'object',
                properties: {
                    paymentId: typebox_1.Type.String(),
                },
                required: ['paymentId'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: typebox_1.Type.Boolean(),
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { paymentId } = request.params;
        await opts.giftCardService.removePayment(paymentId);
        return reply.status(200).send({ success: true });
    });
};
exports.mockGiftCardServiceRoutes = mockGiftCardServiceRoutes;
