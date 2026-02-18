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
      const res = await opts.giftCardService.redeem(request.body, request);

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

  /**
   * Test redeem endpoint - For manual testing only
   * Directly calls CRM to redeem gift card without creating payment object
   * This bypasses the normal payment flow
   */
  fastify.post<{
    Body: {
      code: string;
      pin: string;
      amount: number;
      referenceId?: string;
    };
    Reply: {
      ok: boolean;
      status: number;
      data?: any;
      message?: string;
      error?: string;
      details?: any;
    };
  }>(
    '/test/redeem',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        body: {
          type: 'object',
          properties: {
            code: Type.String({ minLength: 10, maxLength: 19 }),
            pin: Type.String({ minLength: 4, maxLength: 8 }),
            amount: Type.Number({ minimum: 0.01 }),
            referenceId: Type.Optional(Type.String()),
          },
          required: ['code', 'pin', 'amount'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              ok: Type.Boolean(),
              status: Type.Number(),
              data: Type.Optional(Type.Any()),
              message: Type.Optional(Type.String()),
            },
          },
          400: {
            type: 'object',
            properties: {
              ok: Type.Boolean(),
              status: Type.Number(),
              error: Type.Optional(Type.String()),
              details: Type.Optional(Type.Any()),
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { code, pin, amount, referenceId } = request.body;

      try {
        // Call service testRedeem method
        const result = await (opts.giftCardService as any).testRedeem({
          code,
          pin,
          amount,
          referenceId: referenceId || `TEST-${Date.now()}`,
        });

        return reply.status(200).send({
          ok: true,
          status: 200,
          data: result,
          message: 'Gift card redeemed successfully',
        });
      } catch (error: any) {
        return reply.status(400).send({
          ok: false,
          status: 400,
          error: error.message || 'Redemption failed',
          details: error.response?.data || {},
        });
      }
    },
  );
};
