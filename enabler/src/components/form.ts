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
  private isSubmitting: boolean = false;

  constructor(opts: { giftcardOptions: GiftCardOptions; baseOptions: BaseOptions }) {
    super(opts);
    this.i18n = new I18n(translations);
    this.balance = this.balance.bind(this);
    this.submit = this.submit.bind(this);
    this.handleAddGiftCard = this.handleAddGiftCard.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  private handleClose(): void {
    const modal = document.getElementById('giftcard-modal');
    if (modal) {
      modal.remove();
    }
  }

  private handleCancel(): void {
    this.handleClose();
  }

  private async handleAddGiftCard(): Promise<void> {
    if (this.isSubmitting) return;

    try {
      this.isSubmitting = true;
      const submitButton = document.getElementById('add-giftcard-button') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
      }

      // First check balance
      const balanceResult = await this.balance();

      if (balanceResult && balanceResult.status.state === 'Valid' && balanceResult.amount) {
        // If balance is valid, submit the payment with the full balance
        await this.submit({ amount: balanceResult.amount });

        // Close modal on success
        this.handleClose();
      }
    } catch (err) {
      // Error handling is done in balance() and submit()
      console.error('Error adding gift card:', err);
    } finally {
      this.isSubmitting = false;
      const submitButton = document.getElementById('add-giftcard-button') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Gift Card';
      }
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

      const requestBody = {
        amount: params.amount,
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

      const paymentResult: PaymentResult = {
        isSuccess: redeemResult.isSuccess,
        paymentReference: redeemResult.paymentReference,
      };

      this.baseOptions.onComplete(paymentResult);
    } catch (err) {
      this.baseOptions.onError(err);
      throw err;
    }
  }

  mount(selector: string): void {
    document.querySelector(selector).insertAdjacentHTML('afterbegin', this._getField());

    // Add event listeners
    const closeButton = document.getElementById('giftcard-close-button');
    const cancelButton = document.getElementById('giftcard-cancel-button');
    const addButton = document.getElementById('add-giftcard-button');
    const modalBackdrop = document.getElementById('giftcard-modal-backdrop');

    if (closeButton) {
      closeButton.addEventListener('click', this.handleClose);
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', this.handleCancel);
    }

    if (addButton) {
      addButton.addEventListener('click', this.handleAddGiftCard);
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.handleClose();
        }
      });
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
      <div id="giftcard-modal" class="${inputFieldStyles.modal}">
        <div id="giftcard-modal-backdrop" class="${inputFieldStyles.modalBackdrop}"></div>
        <div class="${inputFieldStyles.modalContent}">
          <div class="${inputFieldStyles.modalHeader}">
            <h2 class="${inputFieldStyles.modalTitle}">Add a Gift Card</h2>
            <button
              type="button"
              id="giftcard-close-button"
              class="${inputFieldStyles.closeButton}"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div class="${inputFieldStyles.modalBody}">
            <div class="${inputFieldStyles.inputGroup}">
              <label for="${fieldIds.code}" class="${inputFieldStyles.inputLabel}">
                Gift card code
              </label>
              <input
                type="text"
                id="${fieldIds.code}"
                class="${inputFieldStyles.input}"
                placeholder=""
                autocomplete="off"
              />
              <div id="giftcard-code-error" class="${inputFieldStyles.errorField}" role="alert"></div>
            </div>

            <div class="${inputFieldStyles.inputGroup}">
              <label for="${fieldIds.pin}" class="${inputFieldStyles.inputLabel}">
                Pin Number
              </label>
              <input
                type="text"
                id="${fieldIds.pin}"
                class="${inputFieldStyles.input}"
                placeholder=""
                autocomplete="off"
              />
              <div id="giftcard-pin-error" class="${inputFieldStyles.errorField}" role="alert"></div>
            </div>
          </div>

          <div class="${inputFieldStyles.modalFooter}">
            <button
              type="button"
              id="add-giftcard-button"
              class="${inputFieldStyles.addButton}"
            >
              Add Gift Card
            </button>
            <button
              type="button"
              id="giftcard-cancel-button"
              class="${inputFieldStyles.cancelButton}"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
