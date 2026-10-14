import { authErrorMessage } from './auth-errors';

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'Nieprawidłowy email lub hasło.'],
    ['user_already_exists', 'Konto z tym adresem już istnieje.'],
    ['email_exists', 'Konto z tym adresem już istnieje.'],
    ['weak_password', 'Hasło jest za słabe. Użyj co najmniej 6 znaków.'],
    ['email_not_confirmed', 'Potwierdź adres email, klikając link w wiadomości.'],
    ['over_request_rate_limit', 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.'],
    ['over_email_send_rate_limit', 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.'],
    ['validation_failed', 'Sprawdź poprawność adresu email.'],
    ['email_address_invalid', 'Sprawdź poprawność adresu email.'],
  ])('maps code %s', (code, message) => {
    expect(authErrorMessage({ code })).toBe(message);
  });

  it('maps network failures', () => {
    const network = 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.';
    expect(authErrorMessage({ name: 'AuthRetryableFetchError' })).toBe(network);
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toBe(network);
  });

  it.each([null, undefined, { code: 'unknown_code' }, { code: 'constructor' }, 'boom'])(
    'falls back to the default message for %s',
    (error) => {
      expect(authErrorMessage(error)).toBe('Coś poszło nie tak. Spróbuj ponownie.');
    },
  );
});
