"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const payment_sdk_1 = require("../../payment-sdk");
const giftcard_route_1 = require("../../routes/giftcard.route");
const app_1 = require("../app");
async function default_1(server) {
    await server.register(giftcard_route_1.mockGiftCardServiceRoutes, {
        giftCardService: app_1.app.services.giftCardService,
        sessionHeaderAuthHook: payment_sdk_1.paymentSDK.sessionHeaderAuthHookFn,
        sessionQueryParamAuthHook: payment_sdk_1.paymentSDK.sessionQueryParamAuthHookFn,
    });
}
