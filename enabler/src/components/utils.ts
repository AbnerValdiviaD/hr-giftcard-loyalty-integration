import { GiftCardOptions } from '../providers/definitions';
import inputFieldStyles from '../style/inputField.module.scss';

export const getInput = (field: string) => document.querySelector(`#${field}`) as HTMLInputElement;

export const showError = (field: string, textContent: string) => {
  const input = getInput(field);
  const errorElement = document.getElementById(`${field}-error`);
  if (errorElement) {
    errorElement.textContent = textContent;
    errorElement.classList.remove(inputFieldStyles.hidden);
  }
  if (input?.parentElement) {
    input.parentElement.classList.add(inputFieldStyles.error);
  }
};

export const hideError = (field: string) => {
  const input = getInput(field);
  const errorElement = document.getElementById(`${field}-error`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.add(inputFieldStyles.hidden);
  }
  if (input?.parentElement) {
    input.parentElement.classList.remove(inputFieldStyles.error);
  }
};

export const fieldIds = {
  checkbox: 'giftcard-checkbox',
  code: 'giftcard-code',
  pin: 'giftcard-pin',
  amount: 'giftcard-amount',
};

const handleChangeEvent = (field: string, onValueChange?: (hasValue: boolean) => Promise<void>) => {
  const input = getInput(field);
  if (!input) return;

  input.addEventListener('input', () => {
    onValueChange?.(input.value !== '');
  });

  input.addEventListener('focusout', () => {
    if (input.value.length > 0) {
      input.parentElement?.classList.add(inputFieldStyles.containValue);
    } else {
      input.parentElement?.classList.remove(inputFieldStyles.containValue);
    }
  });
};

export const addFormFieldsEventListeners = (giftcardOptions: GiftCardOptions) => {
  // Auto-hide errors when user types in the fields
  handleChangeEvent(fieldIds.code, async () => hideError(fieldIds.code));
  handleChangeEvent(fieldIds.pin, async () => hideError(fieldIds.pin));

  // Handle Enter key press if callback is provided
  handleEnter(fieldIds.code, giftcardOptions?.onEnter);
  handleEnter(fieldIds.pin, giftcardOptions?.onEnter);

  // Note: onValueChange is handled manually in FormComponent based on amount validity
  // This allows the SDK to be notified only when amount > 0 and <= balance
};

type Res = {
  status: {
    state: string;
    errors?: {
      code: string;
      message: string;
    }[];
  };
  amount?: {
    centAmount: number;
    currencyCode: string;
  };
};

export const getErrorCode = (res: Res): string | null =>
  res.status.state !== 'Valid' ? res.status.errors?.[0].code || 'GenericError' : null;

export const handleEnter = (field: string, callback: (e: Event) => void) => {
  getInput(field).addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      callback(e);
    }
  });
};
