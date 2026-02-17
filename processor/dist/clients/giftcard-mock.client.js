"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAPI = exports.GiftCardClient = void 0;
const config_1 = require("../config/config");
const giftcard_mock_client_type_1 = require("./types/giftcard-mock.client.type");
const crypto_1 = require("crypto");
/**
 * GiftCardClient acts as a mock Client SDK API provided by external gift card service providers. Mock Client SDK is used due to no actual communication involved in this gift card connector template. If SDK is available by specific gift card service provider, the SDK should be invoked directly in service layer and this mock client will be no longer in use.
 */
class GiftCardClient {
    currency;
    constructor(opts) {
        this.currency = opts.currency;
    }
    async healthcheck() {
        return this.promisify({
            status: 'OK',
        });
    }
    async balance(code) {
        /** In mock example, we categorize different use cases based on the input giftcard code
         *
         * "Valid-<amount>-<currency>" - It represents a valid giftcard with specified balance and currency.
         * "Expired" - The giftcard code represents an expired giftcard.
         * "GenericError" - It represents a giftcard code which leads to generic error from giftcard service provider.
         * "NotFound" - It represents a non-existing giftcard code.
         */
        const [type, amount, currency] = code.split('-');
        switch (type) {
            case giftcard_mock_client_type_1.GiftCardCodeType.EXPIRED:
                return this.promisify({
                    message: 'The gift card is expired.',
                    code: giftcard_mock_client_type_1.GiftCardCodeType.EXPIRED,
                });
            case giftcard_mock_client_type_1.GiftCardCodeType.GENERIC_ERROR:
                return this.promisify({
                    message: 'Generic error occurs.',
                    code: giftcard_mock_client_type_1.GiftCardCodeType.GENERIC_ERROR,
                });
            case giftcard_mock_client_type_1.GiftCardCodeType.VALID: {
                if (!amount || !currency) {
                    return this.promisify({
                        message: 'The code provided is invalid, missing amount and currency',
                        code: giftcard_mock_client_type_1.GiftCardCodeType.INVALID,
                    });
                }
                if (amount === '0') {
                    return this.promisify({
                        message: 'The gift card provided has no balance.',
                        code: giftcard_mock_client_type_1.GiftCardCodeType.ZERO_BALANCE,
                    });
                }
                if (this.currency !== currency) {
                    return this.promisify({
                        message: 'cart and gift card currency do not match',
                        code: giftcard_mock_client_type_1.GiftCardCodeType.CURRENCY_NOT_MATCH,
                    });
                }
                return this.promisify({
                    message: 'The gift card is valid.',
                    code: giftcard_mock_client_type_1.GiftCardCodeType.VALID,
                    amount: {
                        centAmount: Number(amount),
                        currencyCode: currency,
                    },
                });
            }
            case giftcard_mock_client_type_1.GiftCardCodeType.NOT_FOUND:
                return this.promisify({
                    message: 'The gift card code is not found.',
                    code: giftcard_mock_client_type_1.GiftCardCodeType.NOT_FOUND,
                });
            default:
                return this.promisify({
                    message: 'The code provided is invalid',
                    code: giftcard_mock_client_type_1.GiftCardCodeType.INVALID,
                });
        }
    }
    async redeem(request) {
        const giftCardCode = request.code;
        const giftCardCodeBreakdown = giftCardCode.split('-');
        if (giftCardCodeBreakdown.length === 3 &&
            giftCardCodeBreakdown[0] === giftcard_mock_client_type_1.GiftCardCodeType.VALID &&
            giftCardCodeBreakdown[1] !== '0') {
            return this.promisify({
                resultCode: 'SUCCESS',
                redemptionReference: `mock-connector-redemption-id-${(0, crypto_1.randomUUID)()}`,
                code: request.code,
                amount: request.amount,
            });
        }
        return this.promisify({
            resultCode: 'FAILURE',
            code: request.code,
            amount: request.amount,
        });
    }
    async rollback(redemptionReference) {
        //HINT: Because we will actually be registering a refund transaction in the payment object, this has to be a valid redemption reference.
        // Also note that the redemptionReference used in this method will be fetched from payment.interfaceId, which will be set by the /redeem endpoint
        //TODO: add to comment in PR =>>> We do not need a controlled error scenario here
        if (redemptionReference.split('-')[0] !== 'mock') {
            // HINT: should someone try to revert a payment reference not created by this mock connector, using this mock connector, then we are likely to enter this block
            return this.promisify({
                result: 'FAILED',
            });
        }
        return this.promisify({
            result: 'SUCCESS',
            id: `mock-connector-rollback-id-${(0, crypto_1.randomUUID)()}`,
        });
    }
    promisify(payload) {
        return Promise.resolve(payload);
    }
}
exports.GiftCardClient = GiftCardClient;
const MockAPI = () => {
    const client = new GiftCardClient({
        currency: (0, config_1.getConfig)().mockConnectorCurrency,
    });
    return client;
};
exports.MockAPI = MockAPI;
