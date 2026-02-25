import {
  Amount,
  BalanceType,
  BaseOptions,
  GiftCardComponent,
  GiftCardOptions,
  PaymentResult,
} from '../providers/definitions';
import { BaseComponentBuilder, DefaultComponent } from './definitions';
import { FormComponent } from './form';
import { LoyaltyFormComponent } from './loyaltyForm';
import styles from '../style/unifiedField.module.scss';

export class UnifiedFormBuilder extends BaseComponentBuilder {
  constructor(baseOptions: BaseOptions) {
    super(baseOptions);
  }

  build(config: GiftCardOptions): GiftCardComponent {
    return new UnifiedFormComponent({
      giftcardOptions: config,
      baseOptions: this.baseOptions,
    });
  }
}

export class UnifiedFormComponent extends DefaultComponent {
  private container: HTMLElement | null = null;
  private giftCardComponent: FormComponent | null = null;
  private loyaltyComponent: LoyaltyFormComponent | null = null;
  private lastGiftCardBalance: BalanceType | null = null;
  private lastLoyaltyBalance: BalanceType | null = null;

  // Track validity state of both forms
  private giftCardValid = false;
  private loyaltyValid = false;
  private lastNotifiedValidity = false;

  constructor(opts: { giftcardOptions: GiftCardOptions; baseOptions: BaseOptions }) {
    super(opts);

    // Bind methods
    this.balance = this.balance.bind(this);
    this.submit = this.submit.bind(this);
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.notifyUnifiedValidity = this.notifyUnifiedValidity.bind(this);
  }

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }

    this.container = element as HTMLElement;
    this.render();

    this.giftcardOptions
      ?.onGiftCardReady?.()
      .then()
      .catch((err) => {
        this.baseOptions.onError(err);
        throw err;
      });
  }

  unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.giftCardComponent = null;
    this.loyaltyComponent = null;
  }

  private render(): void {
    if (!this.container) return;

    const html = `
      <div class="${styles.wrapper}">
        <div class="${styles.section}" id="content-giftcard"></div>
        <div class="${styles.divider}"></div>
        <div class="${styles.section}" id="content-loyalty"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.initializeComponents();
  }

  private initializeComponents(): void {
    // Create gift card component - wrap onValueChange to track validity
    if (document.getElementById('content-giftcard')) {
      this.giftCardComponent = new FormComponent({
        giftcardOptions: {
          ...this.giftcardOptions,
          onValueChange: async (isValid) => {
            console.log('[Unified] Gift card validity changed:', isValid);
            this.giftCardValid = isValid;
            this.notifyUnifiedValidity();
          }
        },
        baseOptions: this.baseOptions,
      });
      this.giftCardComponent.mount('#content-giftcard');
    }

    // Create loyalty component - wrap onValueChange to track validity
    if (document.getElementById('content-loyalty')) {
      this.loyaltyComponent = new LoyaltyFormComponent({
        giftcardOptions: {
          ...this.giftcardOptions,
          onValueChange: async (isValid) => {
            console.log('[Unified] Loyalty validity changed:', isValid);
            this.loyaltyValid = isValid;
            this.notifyUnifiedValidity();
          }
        },
        baseOptions: this.baseOptions,
      });
      this.loyaltyComponent.mount('#content-loyalty');
    }
  }

  private notifyUnifiedValidity(): void {
    // Calculate combined validity: at least one form must be valid
    const isAnyValid = this.giftCardValid || this.loyaltyValid;

    // Only notify SDK if the combined validity state has changed
    if (isAnyValid !== this.lastNotifiedValidity) {
      console.log('[Unified] Combined validity changed to:', isAnyValid,
        `(giftCard: ${this.giftCardValid}, loyalty: ${this.loyaltyValid})`);

      this.lastNotifiedValidity = isAnyValid;

      // Call the real SDK callback
      if (this.giftcardOptions?.onValueChange) {
        this.giftcardOptions.onValueChange(isAnyValid);
      }
    }
  }

  async balance(): Promise<BalanceType> {
    console.log('[Unified] balance() called - checking both forms');

    let giftCardBalance: BalanceType | null = null;
    let loyaltyBalance: BalanceType | null = null;

    // Check gift card balance
    try {
      if (this.giftCardComponent) {
        giftCardBalance = await this.giftCardComponent.balance();
        if (giftCardBalance.status.state === 'Valid') {
          this.lastGiftCardBalance = giftCardBalance;
          console.log('[Unified] Gift card balance valid:', giftCardBalance.amount);
        } else {
          this.lastGiftCardBalance = null;
        }
      }
    } catch (err) {
      console.log('[Unified] Gift card balance check failed:', err);
      this.lastGiftCardBalance = null;
    }

    // Check loyalty balance
    try {
      if (this.loyaltyComponent) {
        loyaltyBalance = await this.loyaltyComponent.balance();
        if (loyaltyBalance.status.state === 'Valid') {
          this.lastLoyaltyBalance = loyaltyBalance;
          console.log('[Unified] Loyalty balance valid:', loyaltyBalance.amount);
        } else {
          this.lastLoyaltyBalance = null;
        }
      }
    } catch (err) {
      console.log('[Unified] Loyalty balance check failed:', err);
      this.lastLoyaltyBalance = null;
    }

    // If both are valid, combine the amounts
    if (this.lastGiftCardBalance && this.lastLoyaltyBalance) {
      const combinedAmount = {
        centAmount:
          (this.lastGiftCardBalance.amount?.centAmount || 0) +
          (this.lastLoyaltyBalance.amount?.centAmount || 0),
        currencyCode: this.lastGiftCardBalance.amount?.currencyCode || 'USD',
      };
      console.log('[Unified] Both payment methods valid - combined balance:', combinedAmount);
      return {
        status: { state: 'Valid' },
        amount: combinedAmount,
      };
    }

    // If only gift card is valid
    if (this.lastGiftCardBalance) {
      console.log('[Unified] Using gift card balance only');
      return this.lastGiftCardBalance;
    }

    // If only loyalty is valid
    if (this.lastLoyaltyBalance) {
      console.log('[Unified] Using loyalty balance only');
      return this.lastLoyaltyBalance;
    }

    // If both fail, return an error
    return {
      status: {
        state: 'GenericError',
        errors: {
          code: 'NoPaymentMethod',
          message: 'Please fill out either the gift card or loyalty form',
        },
      },
    };
  }

  async submit(opts: { amount?: Amount }): Promise<void> {
    console.log('[Unified] submit() called with:', opts);

    // Check which payment methods were valid during the last balance() call
    const hasGiftCard = this.lastGiftCardBalance !== null;
    const hasLoyalty = this.lastLoyaltyBalance !== null;

    if (!hasGiftCard && !hasLoyalty) {
      throw new Error('No valid payment method available for submission');
    }

    // If both are valid, submit to both
    if (hasGiftCard && hasLoyalty) {
      console.log('[Unified] Submitting to both gift card and loyalty');

      const giftCardAmount = this.lastGiftCardBalance?.amount;
      const loyaltyAmount = this.lastLoyaltyBalance?.amount;

      // Submit gift card first
      if (this.giftCardComponent && giftCardAmount) {
        console.log('[Unified] Submitting gift card with amount:', giftCardAmount);
        await this.giftCardComponent.submit({ amount: giftCardAmount });
      }

      // Then submit loyalty
      if (this.loyaltyComponent && loyaltyAmount) {
        console.log('[Unified] Submitting loyalty with amount:', loyaltyAmount);
        await this.loyaltyComponent.submit({ amount: loyaltyAmount });
      }

      console.log('[Unified] Both payments submitted successfully');
      return;
    }

    // If only gift card is valid
    if (hasGiftCard && this.giftCardComponent) {
      console.log('[Unified] Submitting gift card payment only');
      return await this.giftCardComponent.submit(opts);
    }

    // If only loyalty is valid
    if (hasLoyalty && this.loyaltyComponent) {
      console.log('[Unified] Submitting loyalty payment only');
      return await this.loyaltyComponent.submit(opts);
    }

    throw new Error('No valid payment method available for submission');
  }
}
