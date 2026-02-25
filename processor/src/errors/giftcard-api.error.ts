import { Errorx, ErrorxAdditionalOpts } from '@commercetools/connect-payments-sdk';

export type MockApiErrorData = {
  code: number;
  key: string;
  message: string;
  details?: string;
};

export class MockApiError extends Errorx {
  constructor(errorData: MockApiErrorData, additionalOpts?: ErrorxAdditionalOpts) {
    super({
      code: 'GenericError',
      httpErrorStatus: errorData.code,
      message: errorData.message,
      skipLog: true,
      ...additionalOpts,
    });
  }
}

// `Currency of the gift card code - (${errorData.GiftCardCurrency}), does not match cart currency`
export class MockCustomError extends Errorx {
  constructor(errorData: MockApiErrorData, additionalOpts?: ErrorxAdditionalOpts) {
    super({
      code: errorData.key,
      httpErrorStatus: errorData.code,
      message: errorData.message,
      skipLog: true,
      ...additionalOpts,
    });
  }
}

/**
 * Harry Rosen API Error
 * Used for all Harry Rosen gift card API errors (balance, redeem, refund)
 */
export class HarryRosenApiError extends Errorx {
  constructor(errorData: MockApiErrorData, additionalOpts?: ErrorxAdditionalOpts) {
    super({
      code: errorData.key,
      httpErrorStatus: errorData.code,
      message: errorData.message,
      skipLog: true,
      ...additionalOpts,
    });
  }
}
