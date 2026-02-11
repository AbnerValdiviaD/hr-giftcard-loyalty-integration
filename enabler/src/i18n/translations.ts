import { Translations } from './definitions';

export const translations: Translations = {
  en: {
    giftCardPlaceholder: 'Enter and apply gift card number',
    giftCardPinPlaceholder: 'Enter gift card PIN',
    errorNotFound: 'The gift card number you entered is invalid. Please try again.',
    errorExpired: 'The gift card you entered has expired.',
    errorCurrencyNotMatch: 'The currency of the gift card does not match the currency of the cart.',
    errorGenericError: 'We cannot process your gift card at the moment. Please try again.',
    errorZeroBalance: 'The gift card you entered has no balance.',
    errorMissingSecurityCode: 'Please enter the gift card PIN.',
    errorInvalidCardNumber: 'Gift card number must be numeric and more than 12 characters.',
    errorInvalidPIN: 'PIN must be numeric.',
    errorInvalidCardOrPin: 'Invalid gift card number or PIN. Please try again.',
    errorUnauthorized: 'Unable to verify gift card. Please contact support.',
  },
  de: {
    giftCardPlaceholder: 'Geschenkkartennummer eingeben und anwenden',
  },
  fr: {
    giftCardPlaceholder: 'Saisissez et appliquez le numéro de carte cadeau',
  },
  nl: {
    giftCardPlaceholder: 'Voer het cadeaukaartnummer in en pas het toe',
  },
  cz: {
    giftCardPlaceholder: 'Zadejte a použijte číslo dárkové karty',
  },
  sk: {
    giftCardPlaceholder: 'Zadajte a použite číslo darčekovej karty',
  },
  ro: {
    giftCardPlaceholder: 'Introduceți și activați numărul cardului cadou',
  },
};
