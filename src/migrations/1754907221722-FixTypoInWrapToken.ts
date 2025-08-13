import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTypoInWrapToken1754907221722 implements MigrationInterface {
  name = 'FixTypoInWrapToken1754907221722';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "fromStatus" = 'mining_incorrect_payment_id' 
      WHERE "fromStatus" = 'mining_incorect_payment_id'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "fromStatus" = 'mining_incorrect_payment_id_and_amount' 
      WHERE "fromStatus" = 'mining_incorect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "toStatus" = 'mining_incorrect_payment_id' 
      WHERE "toStatus" = 'mining_incorect_payment_id'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "toStatus" = 'mining_incorrect_payment_id_and_amount' 
      WHERE "toStatus" = 'mining_incorect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_transactions" 
      SET "status" = 'mining_incorrect_payment_id' 
      WHERE "status" = 'mining_incorect_payment_id'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_transactions" 
      SET "status" = 'mining_incorrect_payment_id_and_amount' 
      WHERE "status" = 'mining_incorect_payment_id_and_amount'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "wrap_token_transactions" 
      SET "status" = 'mining_incorect_payment_id' 
      WHERE "status" = 'mining_incorrect_payment_id'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_transactions" 
      SET "status" = 'mining_incorect_payment_id_and_amount' 
      WHERE "status" = 'mining_incorrect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "toStatus" = 'mining_incorect_payment_id_and_amount' 
      WHERE "toStatus" = 'mining_incorrect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "toStatus" = 'mining_incorect_payment_id' 
      WHERE "toStatus" = 'mining_incorrect_payment_id'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "fromStatus" = 'mining_incorect_payment_id_and_amount' 
      WHERE "fromStatus" = 'mining_incorrect_payment_id_and_amount'
    `);
    await queryRunner.query(`
      UPDATE "wrap_token_audits" 
      SET "fromStatus" = 'mining_incorect_payment_id' 
      WHERE "fromStatus" = 'mining_incorrect_payment_id'
    `);
  }
}
