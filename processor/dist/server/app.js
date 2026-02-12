"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const payment_sdk_1 = require("../payment-sdk");
const harryrosen_giftcard_service_1 = require("../services/harryrosen-giftcard.service");
const giftCardService = new harryrosen_giftcard_service_1.HarryRosenGiftCardService({
    ctCartService: payment_sdk_1.paymentSDK.ctCartService,
    ctPaymentService: payment_sdk_1.paymentSDK.ctPaymentService,
    ctOrderService: payment_sdk_1.paymentSDK.ctOrderService,
});
exports.app = {
    services: {
        giftCardService,
    },
    hooks: {},
};
