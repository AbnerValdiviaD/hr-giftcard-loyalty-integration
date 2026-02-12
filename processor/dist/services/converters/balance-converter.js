"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceConverter = void 0;
const giftcard_mock_client_type_1 = require("../../clients/types/giftcard-mock.client.type");
const giftcard_api_error_1 = require("../../errors/giftcard-api.error");
class BalanceConverter {
    convert(opts) {
        switch (opts?.code) {
            case giftcard_mock_client_type_1.GiftCardCodeType.VALID:
                return {
                    status: {
                        state: giftcard_mock_client_type_1.GiftCardCodeType.VALID,
                    },
                    amount: {
                        centAmount: opts?.amount.centAmount,
                        currencyCode: opts.amount.currencyCode,
                    },
                };
            case giftcard_mock_client_type_1.GiftCardCodeType.CURRENCY_NOT_MATCH:
                throw new giftcard_api_error_1.MockCustomError({
                    message: opts.message || 'Currency does not match',
                    code: 400,
                    key: giftcard_mock_client_type_1.GiftCardCodeType.CURRENCY_NOT_MATCH,
                });
            case giftcard_mock_client_type_1.GiftCardCodeType.EXPIRED:
                throw new giftcard_api_error_1.MockCustomError({
                    message: opts.message || 'Gift card is expired',
                    code: 400,
                    key: giftcard_mock_client_type_1.GiftCardCodeType.EXPIRED,
                });
            case giftcard_mock_client_type_1.GiftCardCodeType.NOT_FOUND:
                throw new giftcard_api_error_1.MockCustomError({
                    message: opts.message || 'Gift card is not found',
                    code: 404,
                    key: giftcard_mock_client_type_1.GiftCardCodeType.NOT_FOUND,
                });
            case giftcard_mock_client_type_1.GiftCardCodeType.ZERO_BALANCE:
                throw new giftcard_api_error_1.MockCustomError({
                    message: opts.message || 'Gift card has no balance',
                    code: 400,
                    key: giftcard_mock_client_type_1.GiftCardCodeType.ZERO_BALANCE,
                });
            default:
                throw new giftcard_api_error_1.MockCustomError({
                    message: opts.message || 'An error happened during this requests',
                    code: 400,
                    key: giftcard_mock_client_type_1.GiftCardCodeType.GENERIC_ERROR,
                });
        }
    }
}
exports.BalanceConverter = BalanceConverter;
