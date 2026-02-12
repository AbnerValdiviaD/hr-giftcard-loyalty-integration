"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedemptionReferenceType = exports.GiftCardCodeType = void 0;
var GiftCardCodeType;
(function (GiftCardCodeType) {
    GiftCardCodeType["EXPIRED"] = "Expired";
    GiftCardCodeType["GENERIC_ERROR"] = "GenericError";
    GiftCardCodeType["VALID"] = "Valid";
    GiftCardCodeType["CURRENCY_NOT_MATCH"] = "CurrencyNotMatch";
    GiftCardCodeType["NOT_FOUND"] = "NotFound";
    GiftCardCodeType["INVALID"] = "Invalid";
    GiftCardCodeType["ZERO_BALANCE"] = "ZeroBalance";
})(GiftCardCodeType || (exports.GiftCardCodeType = GiftCardCodeType = {}));
/* Mock mechanism to differentiate scenarios of redemption rollback.
 *  It is supposed that a valid redemption rollback should be with redemption ID as 'redemption-ref-valid'
 */
var RedemptionReferenceType;
(function (RedemptionReferenceType) {
    RedemptionReferenceType["REDEMPTION_REF_VALID"] = "redemption-ref-valid";
    RedemptionReferenceType["REDEMPTION_REF_INVALID"] = "redemption-ref-invalid";
})(RedemptionReferenceType || (exports.RedemptionReferenceType = RedemptionReferenceType = {}));
