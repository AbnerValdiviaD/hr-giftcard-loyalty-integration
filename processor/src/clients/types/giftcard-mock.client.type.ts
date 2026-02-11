export type MockClientBalanceResponse = {
  message: string;
  code: string;
  amount?: {
    centAmount: number;
    currencyCode: string;
  };
};

export type MockClientStatusResponse = {
  status: 'OK';
};

export type MockClientRedeemRequest = {
  code: string;
  amount: {
    centAmount: number;
    currencyCode: string;
  };
};

export type MockClientRedeemResponse = {
  resultCode: string;
  redemptionReference?: string;
  code: string;
  amount: {
    centAmount: number;
    currencyCode: string;
  };
};

export type MockClientRollbackResponse = {
  result: string;
  id?: string;
  amount?: number;
};

export enum GiftCardCodeType {
  EXPIRED = 'Expired',
  GENERIC_ERROR = 'GenericError',
  VALID = 'Valid',
  CURRENCY_NOT_MATCH = 'CurrencyNotMatch',
  NOT_FOUND = 'NotFound',
  INVALID = 'Invalid',
  ZERO_BALANCE = 'ZeroBalance',
}

/* Mock mechanism to differentiate scenarios of redemption rollback.
 *  It is supposed that a valid redemption rollback should be with redemption ID as 'redemption-ref-valid'
 */

export enum RedemptionReferenceType {
  REDEMPTION_REF_VALID = 'redemption-ref-valid',
  REDEMPTION_REF_INVALID = 'redemption-ref-invalid',
}
