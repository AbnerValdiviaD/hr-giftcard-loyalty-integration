"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGiftCardService = void 0;
const connect_payments_sdk_1 = require("@commercetools/connect-payments-sdk");
const payment_intents_dto_1 = require("../dtos/operations/payment-intents.dto");
const config_1 = require("../config/config");
const payment_sdk_1 = require("../payment-sdk");
const abstract_giftcard_service_1 = require("./abstract-giftcard.service");
const giftcard_mock_client_1 = require("../clients/giftcard-mock.client");
const giftcard_mock_client_type_1 = require("../clients/types/giftcard-mock.client.type");
const context_1 = require("../libs/fastify/context/context");
const giftcard_api_error_1 = require("../errors/giftcard-api.error");
const balance_converter_1 = require("./converters/balance-converter");
const redemption_converter_1 = require("./converters/redemption-converter");
const package_json_1 = __importDefault(require("../../package.json"));
const logger_1 = require("../libs/logger");
class MockGiftCardService extends abstract_giftcard_service_1.AbstractGiftCardService {
    balanceConverter;
    redemptionConverter;
    constructor(opts) {
        super(opts.ctCartService, opts.ctPaymentService, opts.ctOrderService);
        this.balanceConverter = new balance_converter_1.BalanceConverter();
        this.redemptionConverter = new redemption_converter_1.RedemptionConverter();
    }
    /**
     * Get status
     *
     * @remarks
     * Implementation to provide mocking status of external systems
     *
     * @returns Promise with mocking data containing a list of status from different external systems
     */
    async status() {
        const handler = await (0, connect_payments_sdk_1.statusHandler)({
            timeout: (0, config_1.getConfig)().healthCheckTimeout,
            log: payment_sdk_1.appLogger,
            checks: [
                (0, connect_payments_sdk_1.healthCheckCommercetoolsPermissions)({
                    requiredPermissions: [
                        'manage_payments',
                        'view_sessions',
                        'view_api_clients',
                        'manage_orders',
                        'introspect_oauth_tokens',
                        'manage_checkout_payment_intents',
                    ],
                    ctAuthorizationService: payment_sdk_1.paymentSDK.ctAuthorizationService,
                    projectKey: (0, config_1.getConfig)().projectKey,
                }),
                async () => {
                    try {
                        const healthcheckResult = await (0, giftcard_mock_client_1.MockAPI)().healthcheck();
                        return {
                            name: 'mock giftcard API call',
                            status: 'UP',
                            details: {
                                healthcheckResult,
                            },
                        };
                    }
                    catch (e) {
                        return {
                            name: 'mock giftcard API call',
                            status: 'DOWN',
                            message: `Not able to communicate with giftcard service provider API`,
                            details: {
                                // TODO do not expose the error
                                error: e,
                            },
                        };
                    }
                },
            ],
            metadataFn: async () => ({
                name: package_json_1.default.name,
                description: package_json_1.default.description,
            }),
        })();
        return handler.body;
    }
    async balance(code) {
        const ctCart = await this.ctCartService.getCart({
            id: (0, context_1.getCartIdFromContext)(),
        });
        const amountPlanned = await this.ctCartService.getPaymentAmount({ cart: ctCart });
        if ((0, config_1.getConfig)().mockConnectorCurrency !== amountPlanned.currencyCode) {
            throw new giftcard_api_error_1.MockCustomError({
                message: 'cart and gift card currency do not match',
                code: 400,
                key: 'CurrencyNotMatch',
            });
        }
        const getBalanceResult = await (0, giftcard_mock_client_1.MockAPI)().balance(code);
        return this.balanceConverter.convert(getBalanceResult);
    }
    async redeem(request) {
        const redeemCode = request.code;
        if (redeemCode && redeemCode.startsWith('Valid-00')) {
            throw new giftcard_api_error_1.MockCustomError({
                message: 'The gift card is expired.',
                code: 400,
                key: giftcard_mock_client_type_1.GiftCardCodeType.EXPIRED,
            });
        }
        const ctCart = await this.ctCartService.getCart({
            id: (0, context_1.getCartIdFromContext)(),
        });
        const amountPlanned = await this.ctCartService.getPaymentAmount({ cart: ctCart });
        const redeemAmount = request.amount;
        if ((0, config_1.getConfig)().mockConnectorCurrency !== amountPlanned.currencyCode) {
            throw new giftcard_api_error_1.MockCustomError({
                message: 'cart and gift card currency do not match',
                code: 400,
                key: giftcard_mock_client_type_1.GiftCardCodeType.CURRENCY_NOT_MATCH,
            });
        }
        const ctPayment = await this.ctPaymentService.createPayment({
            amountPlanned: redeemAmount,
            paymentMethodInfo: {
                paymentInterface: (0, context_1.getPaymentInterfaceFromContext)() || 'mock-giftcard-provider',
                method: 'giftcard',
            },
            ...(ctCart.customerId && {
                customer: {
                    typeId: 'customer',
                    id: ctCart.customerId,
                },
            }),
            ...(!ctCart.customerId &&
                ctCart.anonymousId && {
                anonymousId: ctCart.anonymousId,
            }),
        });
        await this.ctCartService.addPayment({
            resource: {
                id: ctCart.id,
                version: ctCart.version,
            },
            paymentId: ctPayment.id,
        });
        const mockRequest = {
            code: redeemCode,
            amount: redeemAmount,
        };
        const response = await (0, giftcard_mock_client_1.MockAPI)().redeem(mockRequest);
        const updatedPayment = await this.ctPaymentService.updatePayment({
            id: ctPayment.id,
            pspReference: response.redemptionReference,
            transaction: {
                type: 'Charge',
                amount: ctPayment.amountPlanned,
                interactionId: response.redemptionReference,
                state: this.redemptionConverter.convertMockClientResultCode(response.resultCode),
            },
        });
        return this.redemptionConverter.convert({ redemptionResult: response, createPaymentResult: updatedPayment });
    }
    /**
     * Remove payment from cart and delete payment object
     */
    async removePayment(paymentId) {
        // TODO: Not fully implemented - SDK doesn't expose updateCart/removePayment
        // For now, payment remains orphaned (no transaction, no funds charged)
        await this.ctPaymentService.getPayment({ id: paymentId });
    }
    /**
     * Capture payment
     *
     * @remarks
     * Implementation to provide the mocking data for payment capture in external PSPs
     *
     * @param request - contains the amount and {@link https://docs.commercetools.com/api/projects/payments | Payment } defined in composable commerce
     * @returns Promise with mocking data containing operation status and PSP reference
     */
    async capturePayment(request) {
        throw new connect_payments_sdk_1.ErrorGeneral('operation not supported', {
            fields: {
                pspReference: request.payment.interfaceId,
            },
            privateMessage: "connector doesn't support capture operation",
        });
    }
    /**
     * Cancel payment
     *
     * @remarks
     * Implementation to provide the mocking data for payment cancel in external PSPs
     *
     * @param request - contains {@link https://docs.commercetools.com/api/projects/payments | Payment } defined in composable commerce
     * @returns Promise with mocking data containing operation status and PSP reference
     */
    async cancelPayment(request) {
        throw new connect_payments_sdk_1.ErrorGeneral('operation not supported', {
            fields: {
                pspReference: request.payment.interfaceId,
            },
            privateMessage: "connector doesn't support cancel operation",
        });
    }
    async refundPayment(request) {
        logger_1.log.info(`Processing payment modification.`, {
            paymentId: request.payment.id,
            action: 'refundPayment',
        });
        const response = await this.handleRefunds({
            amount: request.amount,
            merchantReference: request.merchantReference,
            payment: request.payment,
        });
        logger_1.log.info(`Payment modification completed.`, {
            paymentId: request.payment.id,
            action: 'refundPayment',
            result: response.outcome,
        });
        return response;
    }
    /**
     * Reverse payment
     *
     * @remarks
     * Abstract method to execute payment reversals in support of automated reversals to be triggered by checkout api. The actual invocation to PSPs should be implemented in subclasses
     *
     * @param request
     * @returns Promise with outcome containing operation status and PSP reference
     */
    async reversePayment(request) {
        logger_1.log.info(`Processing payment modification.`, {
            paymentId: request.payment.id,
            action: 'reversePayment',
        });
        const response = await this.handleRefunds({
            amount: request.payment.amountPlanned,
            merchantReference: request.merchantReference,
            payment: request.payment,
        });
        logger_1.log.info(`Payment modification completed.`, {
            paymentId: request.payment.id,
            action: 'reversePayment',
            result: response.outcome,
        });
        return response;
    }
    async handleRefunds(request) {
        await this.ctPaymentService.updatePayment({
            id: request.payment.id,
            transaction: {
                type: 'Refund',
                amount: request.amount,
                state: 'Initial',
            },
        });
        const rollbackResult = await (0, giftcard_mock_client_1.MockAPI)().rollback(request.payment.interfaceId || '');
        await this.ctPaymentService.updatePayment({
            id: request.payment.id,
            transaction: {
                type: 'Refund',
                amount: request.amount,
                interactionId: rollbackResult.id,
                state: rollbackResult.result ? 'Success' : 'Failure',
            },
        });
        return {
            outcome: rollbackResult.result === 'SUCCESS' ? payment_intents_dto_1.PaymentModificationStatus.APPROVED : payment_intents_dto_1.PaymentModificationStatus.REJECTED,
            pspReference: rollbackResult?.id || '',
        };
    }
}
exports.MockGiftCardService = MockGiftCardService;
