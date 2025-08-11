import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewSettings1754907221721 implements MigrationInterface {
    name = 'AddNewSettings1754907221721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ADD "maxBatchSize" integer NOT NULL DEFAULT '50'`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "maxBatchAgeMs" integer NOT NULL DEFAULT '21600000'`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "batchAmountThreshold" numeric(38,0) NOT NULL DEFAULT '20000000000000000000000'`);
        await queryRunner.query(`ALTER TYPE "public"."wrap_token_audits_fromstatus_enum" RENAME TO "wrap_token_audits_fromstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."wrap_token_audits_fromstatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorrect_payment_id', 'mining_incorrect_payment_id_and_amount')`);
        await queryRunner.query(`ALTER TABLE "wrap_token_audits" ALTER COLUMN "fromStatus" TYPE "public"."wrap_token_audits_fromstatus_enum" USING "fromStatus"::"text"::"public"."wrap_token_audits_fromstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."wrap_token_audits_fromstatus_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."wrap_token_audits_tostatus_enum" RENAME TO "wrap_token_audits_tostatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."wrap_token_audits_tostatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorrect_payment_id', 'mining_incorrect_payment_id_and_amount')`);
        await queryRunner.query(`ALTER TABLE "wrap_token_audits" ALTER COLUMN "toStatus" TYPE "public"."wrap_token_audits_tostatus_enum" USING "toStatus"::"text"::"public"."wrap_token_audits_tostatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."wrap_token_audits_tostatus_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."wrap_token_transactions_status_enum" RENAME TO "wrap_token_transactions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."wrap_token_transactions_status_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorrect_payment_id', 'mining_incorrect_payment_id_and_amount')`);
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" TYPE "public"."wrap_token_transactions_status_enum" USING "status"::"text"::"public"."wrap_token_transactions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "public"."wrap_token_transactions_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."wrap_token_transactions_status_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorect_payment_id', 'mining_incorect_payment_id_and_amount')`);
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" TYPE "public"."wrap_token_transactions_status_enum_old" USING "status"::"text"::"public"."wrap_token_transactions_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "public"."wrap_token_transactions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."wrap_token_transactions_status_enum_old" RENAME TO "wrap_token_transactions_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."wrap_token_audits_tostatus_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorect_payment_id', 'mining_incorect_payment_id_and_amount')`);
        await queryRunner.query(`ALTER TABLE "wrap_token_audits" ALTER COLUMN "toStatus" TYPE "public"."wrap_token_audits_tostatus_enum_old" USING "toStatus"::"text"::"public"."wrap_token_audits_tostatus_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."wrap_token_audits_tostatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."wrap_token_audits_tostatus_enum_old" RENAME TO "wrap_token_audits_tostatus_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."wrap_token_audits_fromstatus_enum_old" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'creating_safe_transaction_unprocessable', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_unprocessable', 'safe_transaction_executed', 'timeout', 'mining_tokens_received_below_min_amount', 'mining_incorect_payment_id', 'mining_incorect_payment_id_and_amount')`);
        await queryRunner.query(`ALTER TABLE "wrap_token_audits" ALTER COLUMN "fromStatus" TYPE "public"."wrap_token_audits_fromstatus_enum_old" USING "fromStatus"::"text"::"public"."wrap_token_audits_fromstatus_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."wrap_token_audits_fromstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."wrap_token_audits_fromstatus_enum_old" RENAME TO "wrap_token_audits_fromstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "batchAmountThreshold"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "maxBatchAgeMs"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "maxBatchSize"`);
    }

}
