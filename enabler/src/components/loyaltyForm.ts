import {
  Amount,
  BalanceType,
  BaseOptions,
  GiftCardComponent,
  GiftCardOptions,
  PaymentResult,
} from '../providers/definitions';
import { BaseComponentBuilder, DefaultComponent } from './definitions';
import styles from '../style/loyaltyField.module.scss';

export class LoyaltyFormBuilder extends BaseComponentBuilder {
  constructor(baseOptions: BaseOptions) {
    super(baseOptions);
  }

  build(config: GiftCardOptions): GiftCardComponent {
    return new LoyaltyFormComponent({
      giftcardOptions: config,
      baseOptions: this.baseOptions,
    });
  }
}

export class LoyaltyFormComponent extends DefaultComponent {
  private container: HTMLElement | null = null;
  private pointsInput: HTMLInputElement | null = null;
  private applyButton: HTMLButtonElement | null = null;
  private equivalenceDisplay: HTMLElement | null = null;

  // Loyalty points configuration
  private readonly POINTS_TO_DOLLAR_RATE = 100; // 100 points = $1
  private readonly MINIMUM_REDEMPTION_POINTS = 5000; // 5,000 points minimum
  private readonly MINIMUM_REDEMPTION_DOLLARS = 50; // $50 equivalent

  // User's current points balance (will be fetched from backend)
  private currentPoints: number = 9698; // Default from screenshot, will be updated
  private maxRedemptionPoints: number = 9698;
  private maxRedemptionDollars: number = 96.98;
  private appliedPoints: number = 0;

  constructor(opts: { giftcardOptions: GiftCardOptions; baseOptions: BaseOptions }) {
    super(opts);

    // Bind methods
    this.balance = this.balance.bind(this);
    this.submit = this.submit.bind(this);
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
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
  }

  private render(): void {
    if (!this.container) return;

    const html = `
      <div class="${styles.wrapper}">
        <h2 class="${styles.header}">Club Harry</h2>

        <p class="${styles.balanceInfo}">
          You have ${this.currentPoints.toLocaleString()} points. All redemptions start at a minimum of ${this.MINIMUM_REDEMPTION_POINTS.toLocaleString()} Points ($${this.MINIMUM_REDEMPTION_DOLLARS} equivalent).
        </p>

        <div class="${styles.maxRedemption}">
          <span class="${styles.infoIcon}" id="loyalty-info-icon">ⓘ</span>
          <span class="${styles.maxRedemptionText}">
            Max redemption amount: ${this.maxRedemptionPoints.toLocaleString()} points ($${this.maxRedemptionDollars.toFixed(2)})
          </span>
        </div>

        <div class="${styles.inputSection}">
          <div class="${styles.inputWrapper}">
            <input
              type="number"
              id="loyalty-points"
              class="${styles.input}"
              placeholder="5,000"
              min="${this.MINIMUM_REDEMPTION_POINTS}"
              max="${this.maxRedemptionPoints}"
              step=1
              value="${this.MINIMUM_REDEMPTION_POINTS}"
            />
            <span class="${styles.label}">points</span>
          </div>

          <div class="${styles.equivalence}">
            <span>=</span>
            <span id="dollar-equivalence">$${this.MINIMUM_REDEMPTION_DOLLARS}.00</span>
          </div>
        </div>

        <button type="button" class="${styles.applyButton}" id="loyalty-apply-button">
          Apply
        </button>

        <div id="loyalty-error" class="${styles.errorField}" role="alert"></div>
      </div>

      <div id="loyalty-tooltip" class="${styles.tooltip}" style="display: none;">
        <div class="${styles.tooltipBackdrop}" id="loyalty-tooltip-backdrop"></div>
        <div class="${styles.tooltipContent}">
          <button class="${styles.tooltipClose}" id="loyalty-tooltip-close">×</button>
          <p class="${styles.tooltipMessage}">
            You can redeem your Club Harry points for store credit. Points are converted at a rate of 100 points = $1.
          </p>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    this.pointsInput = document.getElementById('loyalty-points') as HTMLInputElement;
    this.applyButton = document.getElementById('loyalty-apply-button') as HTMLButtonElement;
    this.equivalenceDisplay = document.getElementById('dollar-equivalence');

    // Points input - update dollar equivalence and validate
    this.pointsInput?.addEventListener('input', () => this.handlePointsChange());

    // Apply button
    this.applyButton?.addEventListener('click', () => this.handleApply());

    // Info icon
    const infoIcon = document.getElementById('loyalty-info-icon');
    infoIcon?.addEventListener('click', () => this.showTooltip());

    // Tooltip close handlers
    const tooltipClose = document.getElementById('loyalty-tooltip-close');
    const tooltipBackdrop = document.getElementById('loyalty-tooltip-backdrop');
    tooltipClose?.addEventListener('click', () => this.hideTooltip());
    tooltipBackdrop?.addEventListener('click', () => this.hideTooltip());
  }

  private handlePointsChange(): void {
    const points = parseInt(this.pointsInput?.value || '0');
    const dollars = points / this.POINTS_TO_DOLLAR_RATE;

    // Update dollar equivalence display
    if (this.equivalenceDisplay) {
      this.equivalenceDisplay.textContent = `$${dollars.toFixed(2)}`;
    }

    // Validate and enable/disable apply button
    const isValid = this.validatePoints(points);
    if (this.applyButton) {
      this.applyButton.disabled = !isValid;
    }

    // Notify SDK about form validity
    this.notifySDKValidity(isValid);
  }

  private validatePoints(points: number): boolean {
    const errorElement = document.getElementById('loyalty-error');

    if (!errorElement) return false;

    // Clear previous errors
    errorElement.textContent = '';

    if (points < this.MINIMUM_REDEMPTION_POINTS) {
      errorElement.textContent = `Minimum redemption is ${this.MINIMUM_REDEMPTION_POINTS.toLocaleString()} points ($${this.MINIMUM_REDEMPTION_DOLLARS})`;
      return false;
    }

    if (points > this.maxRedemptionPoints) {
      errorElement.textContent = `You only have ${this.maxRedemptionPoints.toLocaleString()} points available`;
      return false;
    }

    return true;
  }

  private notifySDKValidity(isValid: boolean): void {
    if (this.giftcardOptions?.onValueChange) {
      this.giftcardOptions.onValueChange(isValid);
    }
  }

  private showTooltip(): void {
    const tooltip = document.getElementById('loyalty-tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
    }
  }

  private hideTooltip(): void {
    const tooltip = document.getElementById('loyalty-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  private async handleApply(): Promise<void> {
    const points = parseInt(this.pointsInput?.value || '0');

    console.log('[Loyalty] handleApply() called - preparing data for SDK');
    console.log('[Loyalty] Points:', points);

    if (!this.validatePoints(points)) {
      return;
    }

    // Store the points for later use in submit()
    this.appliedPoints = points;

    // Update UI to show applied state
    if (this.applyButton) {
      this.applyButton.textContent = 'Applied';
      this.applyButton.disabled = true;
    }

    // Notify SDK that form is valid and ready for payment
    console.log('[Loyalty] Notifying SDK that form is ready with points:', this.appliedPoints);
    this.notifySDKValidity(true);

    // Send info to payment flow
    const dollars = this.appliedPoints / this.POINTS_TO_DOLLAR_RATE;
    this.baseOptions.onInfo?.({
      type: 'loyalty_points_applied',
      message: `Loyalty points ready to apply: ${this.appliedPoints} points ($${dollars.toFixed(2)})`,
      data: {
        points: this.appliedPoints,
        dollarValue: dollars,
        remainingPoints: this.currentPoints - this.appliedPoints
      }
    });
  }

  async balance(): Promise<BalanceType> {
    console.log('[Loyalty] balance() called');

    const points = parseInt(this.pointsInput?.value || '0');
    const dollars = points / this.POINTS_TO_DOLLAR_RATE;
    const amountInCents = Math.round(dollars * 100);

    console.log('[Loyalty] Points:', points, 'Dollars:', dollars, 'Cents:', amountInCents);

    // In a real implementation, you would fetch the user's actual points balance from the backend
    // For now, we'll use the applied points or validate against current balance

    if (!this.validatePoints(points)) {
      return {
        status: {
          state: 'GenericError',
          errors: {
            code: 'InvalidPoints',
            message: 'Invalid points amount',
          },
        },
      };
    }

    // Return the amount to be applied
    return {
      status: { state: 'Valid' },
      amount: {
        centAmount: amountInCents,
        currencyCode: 'USD', // This should match your merchant's currency
      },
    };
  }

  async submit(opts: { amount?: Amount }): Promise<void> {
    console.log('[Loyalty] submit() called with:', opts);

    const points = this.appliedPoints || parseInt(this.pointsInput?.value || '0');
    const amount = opts?.amount;

    console.log('[Loyalty] Points:', points);
    console.log('[Loyalty] Amount from SDK:', amount);

    if (!amount) {
      console.error('[Loyalty] Amount is required!');
      throw new Error('Amount is required');
    }

    // In a real implementation, you would call your backend to redeem the loyalty points
    // For now, we'll simulate a successful redemption
    console.log('[Loyalty] Calling /loyalty/redeem endpoint...');

    const response = await fetch(`${this.baseOptions.processorUrl}/loyalty/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.baseOptions.sessionId
      },
      body: JSON.stringify({
        points: points,
        amount: amount
      })
    });

    const result = await response.json();

    console.log('[Loyalty] Redeem response:', { ok: response.ok, status: response.status });

    if (!response.ok) {
      let errorMessage = 'Loyalty redemption failed';

      if (result.errorMessage) {
        errorMessage = result.errorMessage;
      } else if (result.status?.errors?.[0]?.message) {
        errorMessage = result.status.errors[0].message;
      } else if (result.message) {
        errorMessage = result.message;
      }

      console.error('[Loyalty] Redeem failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('[Loyalty] Redeem result:', result);

    if (result.result !== 'Success') {
      console.error('[Loyalty] Redeem failed:', result.errorMessage);
      throw new Error(result.errorMessage || 'Loyalty redemption failed');
    }

    const paymentResult: PaymentResult = {
      isSuccess: true,
      paymentReference: result.paymentReference
    };

    console.log('[Loyalty] Redemption successful, calling onComplete with:', paymentResult);
    this.baseOptions.onComplete?.(paymentResult);

    // Reset applied points after successful redemption
    this.appliedPoints = 0;
    this.currentPoints -= points;

    console.log('[Loyalty] submit() completed successfully');
  }
}
