import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapToken1747828096462 implements MigrationInterface {
  name = 'UpdateWrapToken1747828096462';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."wrap_token_transactions_status_enum" RENAME TO "wrap_token_transactions_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_status_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'unprocessable')`,
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
      `CREATE TYPE "public"."wrap_token_transactions_status_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'creating_safe_transaction', 'safe_transaction_created', 'unprocessable')`,
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
  }
}
