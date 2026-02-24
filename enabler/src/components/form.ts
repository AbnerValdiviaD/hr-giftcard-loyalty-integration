import {
  Amount,
  BalanceType,
  BaseOptions,
  GiftCardComponent,
  GiftCardOptions,
  PaymentResult,
} from '../providers/definitions';
import { BaseComponentBuilder, DefaultComponent } from './definitions';
import {
  fieldIds,
  getInput,
  showError,
  hideError,
  addFormFieldsEventListeners,
} from './utils';
import styles from '../style/inputField.module.scss';

export class FormBuilder extends BaseComponentBuilder {
  constructor(baseOptions: BaseOptions) {
    super(baseOptions);
  }

  build(config: GiftCardOptions): GiftCardComponent {
    return new FormComponent({
      giftcardOptions: config,
      baseOptions: this.baseOptions,
    });
  }
}

export class FormComponent extends DefaultComponent {
  private container: HTMLElement | null = null;
  private cardNumberInput: HTMLInputElement | null = null;
  private pinInput: HTMLInputElement | null = null;
  private amountInput: HTMLInputElement | null = null;
  private loadBalanceButton: HTMLButtonElement | null = null;
  private applyButton: HTMLButtonElement | null = null;
  private showPinButton: HTMLButtonElement | null = null;
  private balanceMessage: HTMLElement | null = null;
  private currentBalance: number = 0;
  private appliedAmount: number = 0;
  private isPinVisible: boolean = false;

  constructor(opts: { giftcardOptions: GiftCardOptions; baseOptions: BaseOptions }) {
    super(opts);

    // Bind methods to preserve `this` context when called externally
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
        <div class="${styles.header}">
          <input type="checkbox" id="giftcard-checkbox" class="${styles.checkbox}" checked />
          <label for="giftcard-checkbox" class="${styles.title}">Redeem a Gift Card</label>
        </div>

        <hr class="${styles.divider}" />

        <div class="${styles.content}" id="giftcard-content">
          <div class="${styles.balanceHeader}">
            <span class="${styles.balanceLabel}">Gift Card Balance</span>
            <span class="${styles.infoIcon}" id="main-info-icon">ⓘ</span>
          </div>

          <p class="${styles.helpText}">
            For gift cards without 16 digits, please contact
            <a href="#" class="${styles.link}">Customer Care</a>.
          </p>

          <div class="${styles.inputRow}">
            <div class="${styles.inputWrapper}">
              <input
                type="text"
                id="giftcard-code"
                class="${styles.input} ${styles.cardNumberInput}"
                placeholder="Enter 16 Digit Card Number"
                maxlength="16"
              />
              <div id="giftcard-code-error" class="${styles.errorField}" role="alert"></div>
            </div>
            <div class="${styles.pinGroup}">
              <div class="${styles.pinInputContainer}">
                <input
                  type="password"
                  id="giftcard-pin"
                  class="${styles.input} ${styles.pinInput}"
                  placeholder="Enter Gift Card PIN"
                  maxlength="4"
                />
                <button type="button" class="${styles.showButton}" id="show-pin">
                  Show
                </button>
              </div>
              <div id="giftcard-pin-error" class="${styles.errorField}" role="alert"></div>
            </div>
            <button type="button" class="${styles.loadBalanceButton}" id="load-balance">
              Load Balance
            </button>
          </div>

          <div class="${styles.balanceSection}" id="balance-section" style="display: none;">
            <div class="${styles.amountInputWrapper}">
              <span class="${styles.dollarSign}">$</span>
              <input
                type="number"
                id="amount"
                class="${styles.input} ${styles.amountInput}"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <p class="${styles.balanceText}" id="balance-message"></p>
          </div>

          <!-- Custom Apply button hidden - SDK button handles everything -->
          <button type="button" class="${styles.applyButton}" id="apply-button" disabled style="display: none;">
            Apply
          </button>
        </div>

      <div id="info-tooltip" class="${styles.tooltip}" style="display: none;">
        <div class="${styles.tooltipBackdrop}" id="tooltip-backdrop"></div>
        <div class="${styles.tooltipContent}">
          <button class="${styles.tooltipClose}" id="tooltip-close">×</button>
          <p class="${styles.tooltipMessage}">Check how much credit is on your gift card.</p>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    this.cardNumberInput = getInput(fieldIds.code);
    this.pinInput = getInput(fieldIds.pin);
    this.amountInput = document.getElementById('amount') as HTMLInputElement;
    this.loadBalanceButton = document.getElementById('load-balance') as HTMLButtonElement;
    this.applyButton = document.getElementById('apply-button') as HTMLButtonElement;
    this.showPinButton = document.getElementById('show-pin') as HTMLButtonElement;
    this.balanceMessage = document.getElementById('balance-message');

    // Add form field event listeners from utils
    // Note: utils.ts handles error hiding and Enter key, but NOT onValueChange
    // We handle onValueChange manually based on amount validity
    addFormFieldsEventListeners(this.giftcardOptions);

    // Checkbox toggle
    const checkbox = document.getElementById('giftcard-checkbox') as HTMLInputElement;
    const content = document.getElementById('giftcard-content');
    const divider = document.querySelector(`.${styles.divider}`) as HTMLElement;

    checkbox?.addEventListener('change', () => {
      if (content && divider) {
        if (checkbox.checked) {
          content.style.display = 'flex';
          divider.style.display = 'block';
        } else {
          content.style.display = 'none';
          divider.style.display = 'none';
        }
      }
    });

    // Load Balance button
    this.loadBalanceButton?.addEventListener('click', () => this.handleLoadBalance());

    // Show/Hide PIN
    this.showPinButton?.addEventListener('click', () => this.togglePinVisibility());

    // Apply button
    this.applyButton?.addEventListener('click', () => this.handleApply());

    // Amount input - enable apply button and notify SDK when amount is valid
    this.amountInput?.addEventListener('input', () => {
      const amount = parseFloat(this.amountInput?.value || '0');
      const isValidAmount = amount > 0 && amount <= this.currentBalance;

      // Enable/disable apply button
      if (this.applyButton) {
        this.applyButton.disabled = !isValidAmount;
      }

      // Notify SDK about form validity
      this.notifySDKValidity(isValidAmount);
    });

    // Card number - only allow numbers
    this.cardNumberInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      input.value = input.value.replace(/\D/g, '');
    });

    // PIN - only allow numbers
    this.pinInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      input.value = input.value.replace(/\D/g, '');
    });

    // Info icon click handlers
    const mainInfoIcon = document.getElementById('main-info-icon');
    mainInfoIcon?.addEventListener('click', () => this.showTooltip());

    // Tooltip close handlers
    const tooltipClose = document.getElementById('tooltip-close');
    const tooltipBackdrop = document.getElementById('tooltip-backdrop');
    tooltipClose?.addEventListener('click', () => this.hideTooltip());
    tooltipBackdrop?.addEventListener('click', () => this.hideTooltip());
  }

  private notifySDKValidity(isValid: boolean): void {
    // Notify the SDK (e.g., commercetools Checkout SDK) about form validity
    // This controls whether the SDK shows/enables the payment button
    if (this.giftcardOptions?.onValueChange) {
      this.giftcardOptions.onValueChange(isValid);
    }
  }

  private togglePinVisibility(): void {
    if (!this.pinInput || !this.showPinButton) return;

    this.isPinVisible = !this.isPinVisible;
    this.pinInput.type = this.isPinVisible ? 'text' : 'password';
    this.showPinButton.textContent = this.isPinVisible ? 'Hide' : 'Show';
  }

  private showTooltip(): void {
    const tooltip = document.getElementById('info-tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
    }
  }

  private hideTooltip(): void {
    const tooltip = document.getElementById('info-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  private async handleLoadBalance(): Promise<void> {
    const cardNumber = this.cardNumberInput?.value || '';
    const pin = this.pinInput?.value || '';

    // Clear previous errors
    hideError(fieldIds.code);
    hideError(fieldIds.pin);

    if (!cardNumber) {
      showError(fieldIds.code, 'Please enter card number');
      return;
    }

    if (!pin) {
      showError(fieldIds.pin, 'Please enter PIN');
      return;
    }

    if (cardNumber.length !== 16) {
      showError(fieldIds.code, 'Card number must be 16 digits');
      return;
    }

    if (this.loadBalanceButton) {
      this.loadBalanceButton.disabled = true;
      this.loadBalanceButton.textContent = 'Loading...';
    }

    try {
      const balanceResult = await this.balance();

      if (balanceResult.status.state === 'Valid' && balanceResult.amount) {
        this.currentBalance = balanceResult.amount.centAmount / 100;
        this.showBalanceSection(this.currentBalance);
        hideError(fieldIds.code);
      } else {
        const errorMessage = balanceResult.status.errors?.[0]?.message || 'Failed to load balance';
        showError(fieldIds.code, errorMessage);
        // Notify SDK that form is invalid
        this.notifySDKValidity(false);
      }
    } catch (error: any) {
      showError(fieldIds.code, 'Error loading balance: ' + error.message);
      // Notify SDK that form is invalid
      this.notifySDKValidity(false);
    } finally {
      if (this.loadBalanceButton) {
        this.loadBalanceButton.disabled = false;
        this.loadBalanceButton.textContent = 'Load Balance';
      }
    }
  }

  private showBalanceSection(balance: number): void {
    const balanceSection = document.getElementById('balance-section');
    if (!balanceSection || !this.balanceMessage || !this.amountInput) return;

    balanceSection.style.display = 'flex';
    this.balanceMessage.innerHTML = `Your current balance is: <strong>$${Math.floor(balance)}</strong>. Please enter the amount you want to redeem and select Apply below.`;

    // Set default amount to full balance
    this.amountInput.value = balance.toString();
    this.amountInput.focus();

    // Enable apply button
    if (this.applyButton) {
      this.applyButton.disabled = false;
    }

    // Notify SDK that form is ready (amount is valid)
    this.notifySDKValidity(true);
  }

  private async handleApply(): Promise<void> {
    const cardNumber = this.cardNumberInput?.value || '';
    const amount = parseFloat(this.amountInput?.value || '0');

    console.log('[GiftCard] handleApply() called - preparing data for SDK');
    console.log('[GiftCard] Card number:', cardNumber ? '****' + cardNumber.slice(-4) : 'empty');
    console.log('[GiftCard] Amount:', amount);

    // Clear previous errors
    hideError(fieldIds.code);

    if (amount <= 0) {
      showError(fieldIds.code, 'Please enter a valid amount');
      return;
    }

    if (amount > this.currentBalance) {
      showError(fieldIds.code, 'Amount exceeds available balance');
      return;
    }

    // Store the amount for later use in submit()
    this.appliedAmount = amount;

    // Update balance display
    this.currentBalance = this.currentBalance - amount;

    // Update balance message
    if (this.balanceMessage) {
      this.balanceMessage.innerHTML = `Gift card applied! Remaining balance: <strong>$${Math.floor(this.currentBalance)}</strong>. Click "Apply Harry Rosen" to complete payment.`;
    }

    // Reset amount input to 0
    if (this.amountInput) {
      this.amountInput.value = '0';
    }

    // Disable apply button
    if (this.applyButton) {
      this.applyButton.disabled = true;
      this.applyButton.textContent = 'Applied';
    }

    // Notify SDK that form is valid and ready for payment
    // SDK will call submit() when user clicks the payment button
    console.log('[GiftCard] Notifying SDK that form is ready with amount:', this.appliedAmount);
    this.notifySDKValidity(true);

    // Send info to payment flow
    this.baseOptions.onInfo?.({
      type: 'gift_card_applied_custom',
      message: `Gift card ready to apply $${this.appliedAmount}`,
      data: {
        cardNumber: cardNumber ? '****' + cardNumber.slice(-4) : '',
        amount: this.appliedAmount,
        remainingBalance: this.currentBalance
      }
    });

    hideError(fieldIds.code);
  }

  async balance(): Promise<BalanceType> {
    console.log('[GiftCard] balance() called');
    const cardNumber = this.cardNumberInput?.value || '';
    const pin = this.pinInput?.value || '';

    console.log('[GiftCard] Card number:', cardNumber ? '****' + cardNumber.slice(-4) : 'empty');
    console.log('[GiftCard] PIN:', pin ? '****' : 'empty');

    const response = await fetch(`${this.baseOptions.processorUrl}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.baseOptions.sessionId
      },
      body: JSON.stringify({
        code: cardNumber,
        securityCode: pin
      })
    });

    const result = await response.json();
    console.log('[GiftCard] Balance response:', { ok: response.ok, status: response.status, result });

    if (!response.ok) {
      // Extract error message from various possible formats
      let errorMessage = 'Failed to check gift card balance';

      // Backend returns: { status: { errors: [...] } }
      if (result.status?.errors?.[0]?.message) {
        errorMessage = result.status.errors[0].message;
      } else if (result.errors?.[0]?.message) {
        errorMessage = result.errors[0].message;
      } else if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        errorMessage = result.error;
      } else if (typeof result === 'string') {
        errorMessage = result;
      }

      console.error('[GiftCard] Balance check failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('[GiftCard] Balance check successful');

    // If user entered a specific amount, return that instead of full balance
    const userAmount = parseFloat(this.amountInput?.value || '0');
    if (userAmount > 0 && result.status?.state === 'Valid' && result.amount) {
      const userAmountInCents = Math.round(userAmount * 100);
      const cardBalanceInCents = result.amount.centAmount;

      console.log('[GiftCard] User specified amount:', userAmount, 'Card balance:', cardBalanceInCents / 100);

      // Check if card has sufficient balance for user's desired amount
      if (cardBalanceInCents >= userAmountInCents) {
        console.log('[GiftCard] Returning user-specified amount to SDK:', userAmountInCents);
        return {
          status: { state: 'Valid' },
          amount: {
            centAmount: userAmountInCents,
            currencyCode: result.amount.currencyCode,
          },
        };
      } else {
        // Insufficient balance for desired amount
        return {
          status: {
            state: 'GenericError',
            errors: {
              code: 'InsufficientBalance',
              message: `Card has $${(cardBalanceInCents / 100).toFixed(2)}, but you requested $${userAmount.toFixed(2)}`,
            },
          },
        };
      }
    }

    return result;
  }

  async submit(opts: { amount?: Amount }): Promise<void> {
    console.log('[GiftCard] submit() called with:', opts);

    const cardNumber = this.cardNumberInput?.value || '';
    const pin = this.pinInput?.value || '';

    // Use SDK's amount (which comes from balance() that already considered user's input)
    const amount = opts?.amount;

    console.log('[GiftCard] Card number:', cardNumber ? '****' + cardNumber.slice(-4) : 'empty');
    console.log('[GiftCard] PIN:', pin ? '****' : 'empty');
    console.log('[GiftCard] Amount from SDK:', amount);

    if (!amount) {
      console.error('[GiftCard] Amount is required!');
      throw new Error('Amount is required');
    }

    console.log('[GiftCard] Calling /redeem endpoint...');
    const response = await fetch(`${this.baseOptions.processorUrl}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.baseOptions.sessionId
      },
      body: JSON.stringify({
        code: cardNumber,
        securityCode: pin,
        amount: amount
      })
    });

    const result = await response.json();

    console.log('[GiftCard] Redeem response:', { ok: response.ok, status: response.status });

    if (!response.ok) {
      // Extract error message - backend may return { errorMessage } for redeem failures
      let errorMessage = 'Redemption failed';

      if (result.errorMessage) {
        errorMessage = result.errorMessage;
      } else if (result.status?.errors?.[0]?.message) {
        errorMessage = result.status.errors[0].message;
      } else if (result.errors?.[0]?.message) {
        errorMessage = result.errors[0].message;
      } else if (result.message) {
        errorMessage = result.message;
      }

      console.error('[GiftCard] Redeem failed (HTTP error):', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('[GiftCard] Redeem result:', result);

    if (!result.isSuccess) {
      console.error('[GiftCard] Redeem failed (isSuccess=false):', result.errorMessage);
      throw new Error(result.errorMessage || 'Redemption failed');
    }

    const paymentResult: PaymentResult = {
      isSuccess: true,
      paymentReference: result.paymentReference
    };

    console.log('[GiftCard] Redemption successful, calling onComplete with:', paymentResult);
    this.baseOptions.onComplete?.(paymentResult);

    // Reset applied amount after successful redemption
    this.appliedAmount = 0;

    console.log('[GiftCard] submit() completed successfully');
  }
}
