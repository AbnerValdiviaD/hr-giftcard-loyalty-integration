"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCustomError = exports.MockApiError = void 0;
const connect_payments_sdk_1 = require("@commercetools/connect-payments-sdk");
class MockApiError extends connect_payments_sdk_1.Errorx {
    constructor(errorData, additionalOpts) {
        super({
            code: 'GenericError',
            httpErrorStatus: errorData.code,
            message: errorData.message,
            skipLog: true,
            ...additionalOpts,
        });
    }
}
exports.MockApiError = MockApiError;
// `Currency of the gift card code - (${errorData.GiftCardCurrency}), does not match cart currency`
class MockCustomError extends connect_payments_sdk_1.Errorx {
    constructor(errorData, additionalOpts) {
        super({
            code: errorData.key,
            httpErrorStatus: errorData.code,
            message: errorData.message,
            skipLog: true,
            ...additionalOpts,
        });
    }
}
exports.MockCustomError = MockCustomError;
