export enum WrapTokenTransactionStatus {
  CREATED = 'created',
  TOKENS_SENT = 'tokens_sent',
  TOKENS_RECEIVED = 'tokens_received',
  TOKENS_RECEIVED_WITH_MISMATCH = 'tokens_received_with_mismatch',
  CREATING_SAFE_TRANSACTION = 'creating_safe_transaction',
  CREATING_SAFE_TRANSACTION_UNPROCESSABLE = 'creating_safe_transaction_unprocessable',
  SAFE_TRANSACTION_CREATED = 'safe_transaction_created',
  EXECUTING_SAFE_TRANSACTION = 'executing_safe_transaction',
  SAFE_TRANSACTION_UNPROCESSABLE = 'safe_transaction_unprocessable',
  SAFE_TRANSACTION_EXECUTED = 'safe_transaction_executed',
  TIMEOUT = 'timeout',

  MINING_TOKENS_RECEIVED_BELOW_MIN_AMOUNT = 'mining_tokens_received_below_min_amount',
  MINING_INCORRECT_PAYMENT_ID = 'mining_incorrect_payment_id',
  MINING_INCORRECT_PAYMENT_ID_AND_AMOUNT = 'mining_incorrect_payment_id_and_amount',
}

export enum WrapTokenTransactionOrigin {
  BRIDGE = 'bridge',
  MININING = 'mining',
}
