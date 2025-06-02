import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenStatus1748862954853 implements MigrationInterface {
  name = 'UpdateWrapTokenStatus1748862954853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tokenAmountInWallet" numeric(38,0)`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_transactions_status_enum" RENAME TO "wrap_token_transactions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_status_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" TYPE "public"."wrap_token_transactions_status_enum" USING "status"::"text"::"public"."wrap_token_transactions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" SET DEFAULT 'created'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_transactions_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_status_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" TYPE "public"."wrap_token_transactions_status_enum_old" USING "status"::"text"::"public"."wrap_token_transactions_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" SET DEFAULT 'created'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_transactions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_transactions_status_enum_old" RENAME TO "wrap_token_transactions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tokenAmountInWallet"`,
    );
  }
}
