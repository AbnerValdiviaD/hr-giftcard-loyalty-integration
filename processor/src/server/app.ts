import { paymentSDK } from '../payment-sdk';
import { HarryRosenGiftCardService } from '../services/harryrosen-giftcard.service';

const giftCardService = new HarryRosenGiftCardService({
  ctCartService: paymentSDK.ctCartService,
  ctPaymentService: paymentSDK.ctPaymentService,
  ctOrderService: paymentSDK.ctOrderService,
});

export const app = {
  services: {
    giftCardService,
  },
  hooks: {},
};
