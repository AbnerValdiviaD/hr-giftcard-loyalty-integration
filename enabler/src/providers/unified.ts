import { UnifiedFormBuilder } from '../components/unifiedForm';
import { FormBuilder } from '../components/form';
import { LoyaltyFormBuilder } from '../components/loyaltyForm';
import { BaseOptions, EnablerOptions, GiftCardEnabler, GiftCardBuilder, PaymentResult } from './definitions';

export class UnifiedEnabler implements GiftCardEnabler {
  setupData: Promise<{ baseOptions: BaseOptions }>;

  constructor(options: EnablerOptions) {
    this.setupData = UnifiedEnabler._Setup(options);
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

  /**
   * Creates a payment form builder
   * @param type - Optional type: 'unified' (default), 'giftcard', or 'loyalty'
   * @returns A builder for the specified payment type
   */
  async createGiftCardBuilder(type: string = 'unified'): Promise<GiftCardBuilder | never> {
    const setupData = await this.setupData;
    if (!setupData) {
      throw new Error('UnifiedEnabler not initialized');
    }

    // Return the appropriate builder based on type
    switch (type.toLowerCase()) {
      case 'giftcard':
        return new FormBuilder(setupData.baseOptions);

      case 'loyalty':
        return new LoyaltyFormBuilder(setupData.baseOptions);

      case 'unified':
      default:
        return new UnifiedFormBuilder(setupData.baseOptions);
    }
  }
}
