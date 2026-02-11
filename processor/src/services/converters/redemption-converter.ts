import { MockClientRedeemResponse } from '../../clients/types/giftcard-mock.client.type';

import { RedeemResponseDTO } from '../../dtos/giftcard.dto';
import { Payment } from '@commercetools/connect-payments-sdk';

export class RedemptionConverter {
  public convertMockClientResultCode(resultCode: string) {
    if (resultCode === 'SUCCESS') {
      return 'Success';
    } else if (resultCode === 'FAILURE') {
      return 'Failure';
    }
    return 'Initial';
  }

  public convert(opts: {
    redemptionResult: MockClientRedeemResponse;
    createPaymentResult: Payment;
  }): RedeemResponseDTO {
    const redemptionResultObj = opts?.redemptionResult;
    const isSuccess = this.convertMockClientResultCode(redemptionResultObj.resultCode || '') === 'Success';

    return {
      isSuccess,
      paymentReference: opts?.createPaymentResult.id || '',
    };
  }
}
