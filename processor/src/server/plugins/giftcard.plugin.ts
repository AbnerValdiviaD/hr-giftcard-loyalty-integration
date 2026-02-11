import { FastifyInstance } from 'fastify';
import { paymentSDK } from '../../payment-sdk';
import { mockGiftCardServiceRoutes } from '../../routes/giftcard.route';
import { app } from '../app';

export default async function (server: FastifyInstance) {
  await server.register(mockGiftCardServiceRoutes, {
    giftCardService: app.services.giftCardService,
    sessionHeaderAuthHook: paymentSDK.sessionHeaderAuthHookFn,
    sessionQueryParamAuthHook: paymentSDK.sessionQueryParamAuthHookFn,
  });
}
