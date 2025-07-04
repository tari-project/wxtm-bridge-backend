import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenEntity1751371902961 implements MigrationInterface {
  name = 'UpdateWrapTokenEntity1751371902961';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "error" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "isNotificationSent" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_audits_fromstatus_enum" RENAME TO "wrap_token_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_audits_fromstatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout')`,
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
      `CREATE TYPE "public"."wrap_token_audits_tostatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout')`,
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
      `CREATE TYPE "public"."wrap_token_transactions_status_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout')`,
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
      `CREATE TYPE "public"."wrap_token_transactions_status_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
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
      `CREATE TYPE "public"."wrap_token_audits_tostatus_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
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
      `CREATE TYPE "public"."wrap_token_audits_fromstatus_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
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
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "isNotificationSent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "error"`,
    );
  }
}
