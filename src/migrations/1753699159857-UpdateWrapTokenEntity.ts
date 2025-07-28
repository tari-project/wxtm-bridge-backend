import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenEntity1753699159857 implements MigrationInterface {
  name = 'UpdateWrapTokenEntity1753699159857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tariBlockHeight" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tariPaymentReference" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tariPaymentReference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tariBlockHeight"`,
    );
  }
}
