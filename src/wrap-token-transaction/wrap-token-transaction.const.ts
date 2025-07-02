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
}
