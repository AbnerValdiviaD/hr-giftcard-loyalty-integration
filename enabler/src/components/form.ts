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
  private isPinVisible: boolean = false;

  constructor(opts: { giftcardOptions: GiftCardOptions; baseOptions: BaseOptions }) {
    super(opts);
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

          <button type="button" class="${styles.applyButton}" id="apply-button" disabled>
            Apply
          </button>
        </div>
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
    const amount = parseFloat(this.amountInput?.value || '0');

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

    if (this.applyButton) {
      this.applyButton.disabled = true;
      this.applyButton.textContent = 'Applying...';
    }

    try {
      await this.submit({
        amount: {
          centAmount: Math.round(amount * 100),
          currencyCode: 'CAD',
        }
      });

      console.log('Gift card redeemed successfully');

      // Update balance after successful apply
      this.currentBalance = this.currentBalance - amount;

      // Update balance message
      if (this.balanceMessage) {
        this.balanceMessage.innerHTML = `Gift card applied! Remaining balance: <strong>$${Math.floor(this.currentBalance)}</strong>`;
      }

      // Reset amount input to 0
      if (this.amountInput) {
        this.amountInput.value = '0';
      }

      // Disable apply button
      if (this.applyButton) {
        this.applyButton.disabled = true;
      }

      // Notify SDK that form is no longer valid (amount is 0)
      this.notifySDKValidity(false);

      hideError(fieldIds.code);
    } catch (error: any) {
      showError(fieldIds.code, 'Error applying gift card: ' + error.message);
      // Notify SDK that form is invalid due to error
      this.notifySDKValidity(false);
      if (this.baseOptions.onError) {
        this.baseOptions.onError(error);
      }
    } finally {
      if (this.applyButton) {
        this.applyButton.textContent = 'Apply';
      }
    }
  }

  async balance(): Promise<BalanceType> {
    const cardNumber = this.cardNumberInput?.value || '';
    const pin = this.pinInput?.value || '';

    const response = await fetch(`${this.baseOptions.processorUrl}/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': this.baseOptions.sessionId
      },
      body: JSON.stringify({
        code: cardNumber,
        securityCode: pin
      })
    });

    const result = await response.json();

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

      throw new Error(errorMessage);
    }

    return result;
  }

  async submit(opts: { amount?: Amount }): Promise<void> {
    const cardNumber = this.cardNumberInput?.value || '';
    const pin = this.pinInput?.value || '';
    const amount = opts?.amount;

    if (!amount) {
      throw new Error('Amount is required');
    }

    const response = await fetch(`${this.baseOptions.processorUrl}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': this.baseOptions.sessionId
      },
      body: JSON.stringify({
        code: cardNumber,
        securityCode: pin,
        amount: amount
      })
    });

    const result = await response.json();

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

      throw new Error(errorMessage);
    }

    if (!result.isSuccess) {
      throw new Error(result.errorMessage || 'Redemption failed');
    }

    const paymentResult: PaymentResult = {
      isSuccess: true,
      paymentReference: result.paymentReference
    };

    this.baseOptions.onComplete?.(paymentResult);
  }
}
