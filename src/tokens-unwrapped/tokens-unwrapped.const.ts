export enum TokensUnwrappedStatus {
  CREATED = 'created',
  CREATED_UNPROCESSABLE = 'created_unprocessable',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  AWAITING_CONFIRMATION_UNPROCESSABLE = 'awaiting_confirmation_unprocessable',
  CONFIRMED = 'confirmed',
  CONFIRMED_AWAITING_APPROVAL = 'confirmed_awaiting_approval',
  CONFIRMED_UNPROCESSABLE = 'confirmed_unprocessable',
  INIT_SEND_TOKENS = 'init_send_tokens',
  SENDING_TOKENS = 'sending_tokens',
  SENDING_TOKENS_UNPROCESSABLE = 'sending_tokens_unprocessable',
  TOKENS_SENT = 'tokens_sent',
}
