"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedemptionConverter = void 0;
class RedemptionConverter {
    convertMockClientResultCode(resultCode) {
        if (resultCode === 'SUCCESS') {
            return 'Success';
        }
        else if (resultCode === 'FAILURE') {
            return 'Failure';
        }
        return 'Initial';
    }
    convert(opts) {
        const redemptionResultObj = opts?.redemptionResult;
        const isSuccess = this.convertMockClientResultCode(redemptionResultObj.resultCode || '') === 'Success';
        return {
            isSuccess,
            paymentReference: opts?.createPaymentResult.id || '',
        };
    }
}
exports.RedemptionConverter = RedemptionConverter;
