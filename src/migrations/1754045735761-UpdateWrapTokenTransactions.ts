import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransactions1754045735761
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransactions1754045735761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "userProvidedTokenAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tariPaymentIdHex"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_origin_enum" AS ENUM('bridge', 'mining')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "origin" "public"."wrap_token_transactions_origin_enum" NOT NULL DEFAULT 'bridge'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tariUserPaymentId" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_audits_fromstatus_enum" RENAME TO "wrap_token_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_audits_fromstatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorect_payment_id', 'mining_incorect_payment_id_and_amount')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_audits" ALTER COLUMN "fromStatus" TYPE "public"."wrap_token_audits_fromstatus_enum" USING "fromStatus"::"text"::"public"."wrap_token_audits_fromstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_audits_tostatus_enum" RENAME TO "wrap_token_audits_tostatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_audits_tostatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorect_payment_id', 'mining_incorect_payment_id_and_amount')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_audits" ALTER COLUMN "toStatus" TYPE "public"."wrap_token_audits_tostatus_enum" USING "toStatus"::"text"::"public"."wrap_token_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_audits_tostatus_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_transactions_status_enum" RENAME TO "wrap_token_transactions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_status_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorect_payment_id', 'mining_incorect_payment_id_and_amount')`,
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
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD CONSTRAINT "UQ_76c44fd65b3d9dd0e9cb5ed7aab" UNIQUE ("tariPaymentReference")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP CONSTRAINT "UQ_76c44fd65b3d9dd0e9cb5ed7aab"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_status_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout')`,
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
      `CREATE TYPE "public"."wrap_token_audits_tostatus_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_audits" ALTER COLUMN "toStatus" TYPE "public"."wrap_token_audits_tostatus_enum_old" USING "toStatus"::"text"::"public"."wrap_token_audits_tostatus_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_audits_tostatus_enum_old" RENAME TO "wrap_token_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_audits_fromstatus_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout')`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_audits" ALTER COLUMN "fromStatus" TYPE "public"."wrap_token_audits_fromstatus_enum_old" USING "fromStatus"::"text"::"public"."wrap_token_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_audits_fromstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_audits_fromstatus_enum_old" RENAME TO "wrap_token_audits_fromstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tariUserPaymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "origin"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_transactions_origin_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tariPaymentIdHex" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "userProvidedTokenAmount" numeric(38,0) NOT NULL`,
    );
  }
}
