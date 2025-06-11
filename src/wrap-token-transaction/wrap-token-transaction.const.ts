export enum WrapTokenTransactionStatus {
  CREATED = 'created',
  TOKENS_SENT = 'tokens_sent',
  TOKENS_RECEIVED = 'tokens_received',
  TOKENS_RECEIVED_WITH_MISMATCH = 'tokens_received_with_mismatch',
  CREATING_SAFE_TRANSACTION = 'creating_safe_transaction',
  SAFE_TRANSACTION_CREATED = 'safe_transaction_created',
  SIGNING_SAFE_TRANSACTION = 'signing_safe_transaction',
  SAFE_TRANSACTION_SIGNED = 'safe_transaction_signed',
  EXECUTING_SAFE_TRANSACTION = 'executing_safe_transaction',
  SAFE_TRANSACTION_EXECUTED = 'safe_transaction_executed',
  TIMEOUT = 'timeout',
}
