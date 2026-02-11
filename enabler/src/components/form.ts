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
  getErrorCode,
  hideError,
  showError,
} from './utils';
import inputFieldStyles from '../style/inputField.module.scss';
import I18n from '../i18n';
import { translations } from '../i18n/translations';

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
  protected i18n: I18n;
  private balanceData: BalanceType | null = null;
  private isPinVisible: boolean = false;
  private remainingBalance: number = 0; // Track remaining balance after applications

  constructor(opts: { giftcardOptions: GiftCardOptions; baseOptions: BaseOptions }) {
    super(opts);
    this.i18n = new I18n(translations);
    this.balance = this.balance.bind(this);
    this.submit = this.submit.bind(this);
    this.togglePinVisibility = this.togglePinVisibility.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleLoadBalance = this.handleLoadBalance.bind(this);
  }

  private togglePinVisibility(): void {
    this.isPinVisible = !this.isPinVisible;
    const pinInput = getInput(fieldIds.pin) as HTMLInputElement;
    const showButton = document.getElementById('pin-show-button');

    if (pinInput) {
      pinInput.type = this.isPinVisible ? 'text' : 'password';
    }
    if (showButton) {
      showButton.textContent = this.isPinVisible ? 'Hide' : 'Show';
    }
  }

  private handleCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const formContent = document.getElementById('giftcard-form-content');

    if (formContent) {
      formContent.style.display = checkbox.checked ? 'block' : 'none';
    }
  }

  private async handleLoadBalance(): Promise<void> {
    const balanceResult = await this.balance();

    if (balanceResult && balanceResult.status.state === 'Valid' && balanceResult.amount) {
      // Show balance result
      this.balanceData = balanceResult;
      this.remainingBalance = balanceResult.amount.centAmount;
      this.renderBalanceResult(false); // false = show full balance initially
    }
  }

  private renderBalanceResult(resetAmountField: boolean = false): void {
    const balanceContainer = document.getElementById('balance-result-container');
    const applyButton = document.getElementById('apply-button') as HTMLButtonElement;

    if (balanceContainer) {
      // Use remaining balance for display
      const balanceToShow = this.remainingBalance;
      const currencyCode = this.balanceData?.amount?.currencyCode || 'CAD';
      const amountInDollars = balanceToShow / 100;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(amountInDollars);

      // Show full balance initially, then 0 after applying
      const amountFieldValue = resetAmountField ? '0' : amountInDollars.toString();

      balanceContainer.innerHTML = `
        <div class="${inputFieldStyles.balanceResult}">
          <div class="${inputFieldStyles.amountInputWrapper}">
            <span class="${inputFieldStyles.currencySymbol}">$</span>
            <input
              type="number"
              id="${fieldIds.amount}"
              class="${inputFieldStyles.amountInput}"
              value="${amountFieldValue}"
              max="${amountInDollars}"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div class="${inputFieldStyles.balanceMessage}">
            <p>Your current balance is: <strong>${formattedAmount}</strong>. Please enter the amount you want to redeem and select Apply below.</p>
          </div>
        </div>
      `;
      balanceContainer.style.display = 'block';
    }

    if (applyButton) {
      applyButton.disabled = false;
      applyButton.classList.remove(inputFieldStyles.disabled);
    }
  }

  async balance(): Promise<BalanceType> {
    try {
      const giftCardCode = getInput(fieldIds.code).value.replace(/\s/g, '');
      const giftCardPin = getInput(fieldIds.pin).value.replace(/\s/g, '');

      // Validate card number: must be numeric and >12 characters
      if (!giftCardCode) {
        showError(fieldIds.code, this.i18n.translate('errorGenericError', this.baseOptions.locale));
        throw new Error('Card number is required');
      }

      if (!/^\d+$/.test(giftCardCode)) {
        showError(fieldIds.code, this.i18n.translate('errorInvalidCardNumber', this.baseOptions.locale));
        throw new Error('Card number must be numeric');
      }

      if (giftCardCode.length <= 12) {
        showError(fieldIds.code, this.i18n.translate('errorInvalidCardNumber', this.baseOptions.locale));
        throw new Error('Card number must be more than 12 characters');
      }

      // Validate PIN: must be numeric
      if (!giftCardPin) {
        showError(fieldIds.pin, this.i18n.translate('errorMissingSecurityCode', this.baseOptions.locale));
        throw new Error('PIN is required');
      }

      if (!/^\d+$/.test(giftCardPin)) {
        showError(fieldIds.pin, this.i18n.translate('errorInvalidPIN', this.baseOptions.locale));
        throw new Error('PIN must be numeric');
      }

      const requestBody = {
        code: giftCardCode,
        securityCode: giftCardPin,
      };

      const fetchBalanceURL = this.baseOptions.processorUrl.endsWith('/')
        ? `${this.baseOptions.processorUrl}balance`
        : `${this.baseOptions.processorUrl}/balance`;

      const response = await fetch(fetchBalanceURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.baseOptions.sessionId,
        },
        body: JSON.stringify(requestBody),
      });

      const jsonResponse = await response.json();

      if (!jsonResponse?.status?.state) {
        throw jsonResponse;
      }

      const errorCode = getErrorCode(jsonResponse);
      if (errorCode) {
        const translatedMessage = this.i18n.keyExists(`error${errorCode}`, this.baseOptions.locale)
          ? this.i18n.translate(`error${errorCode}`, this.baseOptions.locale)
          : this.i18n.translate('errorGenericError', this.baseOptions.locale);
        showError(fieldIds.code, translatedMessage);
      } else {
        hideError(fieldIds.code);
      }

      return jsonResponse;
    } catch (err) {
      showError(fieldIds.code, this.i18n.translate('errorGenericError', this.baseOptions.locale));
      this.baseOptions.onError(err);
      throw err;
    }
  }

  async submit(params: { amount?: Amount }): Promise<void> {
    try {
      const giftCardCode = getInput(fieldIds.code).value.replace(/\s/g, '');
      const giftCardPin = getInput(fieldIds.pin).value.replace(/\s/g, '');

      // Get amount from input field if balance was loaded
      let amountToRedeem = params.amount;

      if (this.balanceData && this.balanceData.amount) {
        const amountInput = getInput(fieldIds.amount) as HTMLInputElement;
        if (amountInput && amountInput.value) {
          const amountInDollars = parseFloat(amountInput.value);

          // Validate amount is not 0 or negative
          if (amountInDollars <= 0) {
            showError(fieldIds.amount, 'Please enter an amount greater than 0');
            return;
          }

          amountToRedeem = {
            centAmount: Math.round(amountInDollars * 100),
            currencyCode: this.balanceData.amount.currencyCode,
          };
        } else {
          showError(fieldIds.amount, 'Please enter an amount to redeem');
          return;
        }
      }

      const requestBody = {
        amount: amountToRedeem,
        code: giftCardCode,
        securityCode: giftCardPin,
      };

      const requestRedeemURL = this.baseOptions.processorUrl.endsWith('/')
        ? `${this.baseOptions.processorUrl}redeem`
        : `${this.baseOptions.processorUrl}/redeem`;

      const response = await fetch(requestRedeemURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.baseOptions.sessionId,
        },
        body: JSON.stringify(requestBody),
      });

      const redeemResult = await response.json();

      if (!response.ok) {
        throw redeemResult;
      }

      // Update remaining balance (deduct the applied amount from UI display)
      if (amountToRedeem) {
        this.remainingBalance = this.remainingBalance - amountToRedeem.centAmount;

        // Re-render the balance display with updated remaining balance and reset amount field to 0
        this.renderBalanceResult(true); // true = reset amount field to 0
      }

      const paymentResult: PaymentResult = {
        isSuccess: redeemResult.isSuccess,
        paymentReference: redeemResult.paymentReference,
      };

      this.baseOptions.onComplete(paymentResult);
    } catch (err) {
      this.baseOptions.onError(err);
    }
  }

  mount(selector: string): void {
    document.querySelector(selector).insertAdjacentHTML('afterbegin', this._getField());

    // Add event listeners
    const checkbox = document.getElementById(fieldIds.checkbox) as HTMLInputElement;
    const showButton = document.getElementById('pin-show-button');
    const loadBalanceButton = document.getElementById('load-balance-button');
    const applyButton = document.getElementById('apply-button');

    if (checkbox) {
      checkbox.addEventListener('change', this.handleCheckboxChange);
    }

    if (showButton) {
      showButton.addEventListener('click', this.togglePinVisibility);
    }

    if (loadBalanceButton) {
      loadBalanceButton.addEventListener('click', this.handleLoadBalance);
    }

    if (applyButton) {
      applyButton.addEventListener('click', () => this.submit({}));
    }

    this.giftcardOptions
      ?.onGiftCardReady?.()
      .then()
      .catch((err) => {
        this.baseOptions.onError(err);
        throw err;
      });
  }

  private _getField() {
    return `
      <div class="${inputFieldStyles.giftCardWrapper}">
        <!-- Checkbox Section -->
        <div class="${inputFieldStyles.checkboxSection}">
          <input
            type="checkbox"
            id="${fieldIds.checkbox}"
            class="${inputFieldStyles.checkbox}"
          />
          <label for="${fieldIds.checkbox}" class="${inputFieldStyles.checkboxLabel}">
            <span class="${inputFieldStyles.checkboxIcon}"></span>
            <span class="${inputFieldStyles.title}">Redeem a Gift Card</span>
          </label>
        </div>

        <!-- Form Content (Hidden by default) -->
        <div id="giftcard-form-content" class="${inputFieldStyles.formContent}" style="display: none;">
          <!-- Gift Card Balance Section -->
          <div class="${inputFieldStyles.sectionHeader}">
            <h3 class="${inputFieldStyles.sectionTitle}">
              Gift Card Balance
              <span class="${inputFieldStyles.infoIcon}">ⓘ</span>
            </h3>
          </div>

          <!-- Help Text -->
          <p class="${inputFieldStyles.helpText}">
            For gift cards without 16 digits, please contact
            <a href="#" class="${inputFieldStyles.link}">Customer Care</a>.
          </p>

          <!-- Input Fields Row -->
          <div class="${inputFieldStyles.inputRow}">
            <!-- Card Number Input -->
            <div class="${inputFieldStyles.inputGroup}">
              <input
                type="text"
                id="${fieldIds.code}"
                class="${inputFieldStyles.input}"
                placeholder="Enter 16 Digit Card Number"
                maxlength="16"
              />
              <div id="giftcard-code-error" class="${inputFieldStyles.errorField}" role="alert"></div>
            </div>

            <!-- PIN Input with Show Button -->
            <div class="${inputFieldStyles.inputGroup} ${inputFieldStyles.pinGroup}">
              <input
                type="password"
                id="${fieldIds.pin}"
                class="${inputFieldStyles.input}"
                placeholder="Enter Gift Card PIN"
                autocomplete="off"
              />
              <button
                type="button"
                id="pin-show-button"
                class="${inputFieldStyles.showButton}"
              >
                Show
              </button>
              <div id="giftcard-pin-error" class="${inputFieldStyles.errorField}" role="alert"></div>
            </div>

            <!-- Load Balance Button -->
            <button
              type="button"
              id="load-balance-button"
              class="${inputFieldStyles.loadBalanceButton}"
            >
              Load Balance
            </button>
          </div>

          <!-- Balance Result Container (Hidden until balance is loaded) -->
          <div id="balance-result-container" class="${inputFieldStyles.balanceResultContainer}" style="display: none;"></div>

          <!-- Apply Button -->
          <button
            type="button"
            id="apply-button"
            class="${inputFieldStyles.applyButton} ${inputFieldStyles.disabled}"
            disabled
          >
            Apply
          </button>
        </div>
      </div>
    `;
  }
}
