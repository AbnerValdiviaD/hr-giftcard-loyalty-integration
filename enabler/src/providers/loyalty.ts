import { LoyaltyFormBuilder } from '../components/loyaltyForm';
import { BaseOptions, EnablerOptions, GiftCardEnabler, GiftCardBuilder, PaymentResult } from './definitions';

export class LoyaltyEnabler implements GiftCardEnabler {
  setupData: Promise<{ baseOptions: BaseOptions }>;

  constructor(options: EnablerOptions) {
    this.setupData = LoyaltyEnabler._Setup(options);
  }

  // Default handlers
  private static onError = (err: any) => {
    console.log(err);
    throw new Error('something went wrong.');
  };

  private static onComplete = (result: PaymentResult) => {
    console.log('onSubmit', result);
  };

  private static _Setup = async (options: EnablerOptions): Promise<{ baseOptions: BaseOptions }> => {
    return {
      baseOptions: {
        sessionId: options.sessionId,
        processorUrl: options.processorUrl,
        locale: options.locale,
        onComplete: options.onComplete ? options.onComplete : this.onComplete,
        onError: options.onError ? options.onError : this.onError,
        onInfo: options.onInfo,
      },
    };
  };

  async createGiftCardBuilder(type: string = 'loyalty'): Promise<GiftCardBuilder | never> {
    const setupData = await this.setupData;
    if (!setupData) {
      throw new Error('LoyaltyEnabler not initialized');
    }

    // LoyaltyEnabler only supports loyalty type
    // Type parameter is ignored for backward compatibility
    return new LoyaltyFormBuilder(setupData.baseOptions);
  }
}
