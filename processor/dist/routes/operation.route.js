"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsRoute = void 0;
const typebox_1 = require("@sinclair/typebox");
const payment_intents_dto_1 = require("../dtos/operations/payment-intents.dto");
const status_dto_1 = require("../dtos/operations/status.dto");
const operationsRoute = async (fastify, opts) => {
    fastify.get('/status', {
        preHandler: [opts.jwtAuthHook.authenticate()],
        schema: {
            response: {
                200: status_dto_1.StatusResponseSchema,
            },
        },
    }, async (request, reply) => {
        const status = await opts.giftCardService.status();
        reply.code(200).send(status);
    });
    fastify.post('/payment-intents/:id', {
        preHandler: [
            opts.oauth2AuthHook.authenticate(),
            opts.authorizationHook.authorize('manage_project', 'manage_checkout_payment_intents'),
        ],
        schema: {
            params: {
                $id: 'paramsSchema',
                type: 'object',
                properties: {
                    id: typebox_1.Type.String(),
                },
                required: ['id'],
            },
            body: payment_intents_dto_1.PaymentIntentRequestSchema,
            response: {
                200: payment_intents_dto_1.PaymentIntentResponseSchema,
            },
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const response = await opts.giftCardService.modifyPayment({
            paymentId: id,
            data: request.body,
        });
        return reply.status(200).send(response);
    });
};
exports.operationsRoute = operationsRoute;
