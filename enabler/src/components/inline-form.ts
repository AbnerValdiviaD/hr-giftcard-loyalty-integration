import { BaseOptions, GiftCardBuilder, GiftCardComponent, PaymentResult } from '../providers/definitions';
import styles from '../style/inlineForm.module.scss';

export class InlineFormBuilder implements GiftCardBuilder {
  private baseOptions: BaseOptions;

  constructor(baseOptions: BaseOptions) {
    this.baseOptions = baseOptions;
  }

  build(): GiftCardComponent {
    return new InlineForm(this.baseOptions);
  }
}

class InlineForm implements GiftCardComponent {
  private baseOptions: BaseOptions;
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

  constructor(baseOptions: BaseOptions) {
    this.baseOptions = baseOptions;
  }

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }

    this.container = element as HTMLElement;
    this.render();
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
            <input
              type="text"
              id="giftcard-code"
              class="${styles.input} ${styles.cardNumberInput}"
              placeholder="Enter 16 Digit Card Number"
              maxlength="16"
            />
            <div class="${styles.pinGroup}">
              <input
                type="password"
                id="pin"
                class="${styles.input} ${styles.pinInput}"
                placeholder="Enter Gift Card PIN"
                maxlength="4"
              />
              <button type="button" class="${styles.showButton}" id="show-pin">
                Show
              </button>
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
    this.cardNumberInput = document.getElementById('giftcard-code') as HTMLInputElement;
    this.pinInput = document.getElementById('pin') as HTMLInputElement;
    this.amountInput = document.getElementById('amount') as HTMLInputElement;
    this.loadBalanceButton = document.getElementById('load-balance') as HTMLButtonElement;
    this.applyButton = document.getElementById('apply-button') as HTMLButtonElement;
    this.showPinButton = document.getElementById('show-pin') as HTMLButtonElement;
    this.balanceMessage = document.getElementById('balance-message');

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

    // Amount input - enable apply button when amount entered
    this.amountInput?.addEventListener('input', () => {
      const amount = parseFloat(this.amountInput?.value || '0');
      if (this.applyButton) {
        this.applyButton.disabled = amount <= 0 || amount > this.currentBalance;
      }
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

    if (!cardNumber || !pin) {
      alert('Please enter both card number and PIN');
      return;
    }

    if (cardNumber.length !== 16) {
      alert('Card number must be 16 digits');
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
      } else {
        const errorMessage = balanceResult.status.errors?.[0]?.message || 'Failed to load balance';
        alert(errorMessage);
      }
    } catch (error: any) {
      alert('Error loading balance: ' + error.message);
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
  }

  private async handleApply(): Promise<void> {
    const amount = parseFloat(this.amountInput?.value || '0');

    if (amount <= 0 || amount > this.currentBalance) {
      alert('Invalid amount');
      return;
    }

    if (this.applyButton) {
      this.applyButton.disabled = true;
      this.applyButton.textContent = 'Applying...';
    }

    try {
      const result = await this.submit({
        amount: {
          centAmount: Math.round(amount * 100),
          currencyCode: 'CAD',
          fractionDigits: 2
        }
      });

      console.log('Gift card redeemed successfully:', result);

      // Update balance after successful apply
      this.currentBalance = this.currentBalance - amount;

      // Update balance message
      if (this.balanceMessage) {
        this.balanceMessage.innerHTML = `Your current balance is: <strong>$${Math.floor(this.currentBalance)}</strong>. Please enter the amount you want to redeem and select Apply below.`;
      }

      // Reset amount input to 0
      if (this.amountInput) {
        this.amountInput.value = '0';
      }

      // Disable apply button
      if (this.applyButton) {
        this.applyButton.disabled = true;
      }

      // DON'T call onComplete to prevent triggering order creation in checkout SDK
      // The checkout SDK should handle order creation through its own flow
      // if (this.baseOptions.onComplete) {
      //   this.baseOptions.onComplete(result);
      // }
    } catch (error: any) {
      alert('Error applying gift card: ' + error.message);
      if (this.baseOptions.onError) {
        this.baseOptions.onError(error);
      }
    } finally {
      if (this.applyButton) {
        this.applyButton.textContent = 'Apply';
      }
    }
  }

  async balance(): Promise<any> {
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
      const errorMessage = result.errors?.[0]?.message || result.message || response.statusText;
      throw new Error(errorMessage);
    }

    return result;
  }

  async submit(opts?: { amount?: any }): Promise<PaymentResult> {
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
      const errorMessage = result.errors?.[0]?.message || result.message || response.statusText;
      throw new Error(errorMessage);
    }

    if (!result.isSuccess) {
      throw new Error(result.errorMessage || 'Redemption failed');
    }

    return {
      isSuccess: true,
      paymentReference: result.paymentReference
    };
  }
}
