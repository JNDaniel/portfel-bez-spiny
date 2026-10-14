const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Nieprawidłowy email lub hasło.',
  user_already_exists: 'Konto z tym adresem już istnieje.',
  email_exists: 'Konto z tym adresem już istnieje.',
  weak_password: 'Hasło jest za słabe. Użyj co najmniej 6 znaków.',
  email_not_confirmed: 'Potwierdź adres email, klikając link w wiadomości.',
  over_request_rate_limit: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.',
  over_email_send_rate_limit: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.',
  validation_failed: 'Sprawdź poprawność adresu email.',
  email_address_invalid: 'Sprawdź poprawność adresu email.',
};

const NETWORK_MESSAGE = 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.';
const DEFAULT_MESSAGE = 'Coś poszło nie tak. Spróbuj ponownie.';

/** Maps a supabase-js auth error (or any thrown value) to a Polish form message. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return NETWORK_MESSAGE;
  }
  if (typeof error !== 'object' || error === null) {
    return DEFAULT_MESSAGE;
  }
  const { code, name } = error as { code?: unknown; name?: unknown };
  if (typeof code === 'string' && Object.hasOwn(MESSAGES, code)) {
    return MESSAGES[code];
  }
  if (name === 'AuthRetryableFetchError') {
    return NETWORK_MESSAGE;
  }
  return DEFAULT_MESSAGE;
}
