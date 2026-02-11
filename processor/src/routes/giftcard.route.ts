import {
  SessionHeaderAuthenticationHook,
  SessionQueryParamAuthenticationHook,
} from '@commercetools/connect-payments-sdk';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AbstractGiftCardService } from '../services/abstract-giftcard.service';
import {
  BalanceRequestSchemaDTO,
  BalanceResponseSchema,
  BalanceResponseSchemaDTO,
  RedeemRequestDTO,
  RedeemResponseSchema,
} from '../dtos/giftcard.dto';
import { Type } from '@sinclair/typebox';
import { AmountSchema } from '../dtos/operations/payment-intents.dto';

type RoutesOptions = {
  giftCardService: AbstractGiftCardService;
  sessionHeaderAuthHook: SessionHeaderAuthenticationHook;
  sessionQueryParamAuthHook: SessionQueryParamAuthenticationHook;
};

/**
 * MockGiftCardServiceRoutes is used to expose endpoints for giftcard management. Since the required requests/responses/parameters may vary among different gift card service providers, here we provide sample routes for further customization.
 */
export const mockGiftCardServiceRoutes = async (
  fastify: FastifyInstance,

  opts: FastifyPluginOptions & RoutesOptions,
) => {
  fastify.post<{
    Reply: BalanceResponseSchemaDTO | void;
    Body: BalanceRequestSchemaDTO;
  }>(
    '/balance',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        body: {
          type: 'object',
          properties: {
            code: Type.String(),
            securityCode: Type.Optional(Type.String()),
          },
          required: ['code'],
        },
        response: {
          200: BalanceResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { code, securityCode } = request.body;
      const res = await opts.giftCardService.balance(code, securityCode);
      return reply.status(200).send(res);
    },
  );

  fastify.post<{ Body: RedeemRequestDTO; Reply: void }>(
    '/redeem',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        body: {
          type: 'object',
          properties: {
            code: Type.String(),
            securityCode: Type.Optional(Type.String()),
            amount: AmountSchema,
          },
          required: ['code', 'amount'],
        },
        response: {
          200: RedeemResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const res = await opts.giftCardService.redeem(request.body);

      return reply.status(200).send(res);
    },
  );

  fastify.delete<{
    Params: { paymentId: string };
    Reply: { success: boolean };
  }>(
    '/payment/:paymentId',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        params: {
          type: 'object',
          properties: {
            paymentId: Type.String(),
          },
          required: ['paymentId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: Type.Boolean(),
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { paymentId } = request.params;
      await opts.giftCardService.removePayment(paymentId);
      return reply.status(200).send({ success: true });
    },
  );
};
