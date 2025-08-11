import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewSettings1754907221721 implements MigrationInterface {
  name = 'AddNewSettings1754907221721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "maxBatchSize" integer NOT NULL DEFAULT '50'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "maxBatchAgeMs" integer NOT NULL DEFAULT '21600000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "batchAmountThreshold" numeric(38,0) NOT NULL DEFAULT '20000000000000000000000'`,
    );
    await queryRunner.query(`
      ALTER TYPE "public"."wrap_token_audits_fromstatus_enum" 
      ADD VALUE 'mining_incorrect_payment_id'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."wrap_token_audits_fromstatus_enum" 
      ADD VALUE 'mining_incorrect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."wrap_token_audits_tostatus_enum" 
      ADD VALUE 'mining_incorrect_payment_id'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."wrap_token_audits_tostatus_enum" 
      ADD VALUE 'mining_incorrect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."wrap_token_transactions_status_enum" 
      ADD VALUE 'mining_incorrect_payment_id'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."wrap_token_transactions_status_enum" 
      ADD VALUE 'mining_incorrect_payment_id_and_amount'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "batchAmountThreshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "maxBatchAgeMs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "maxBatchSize"`,
    );
  }
}
