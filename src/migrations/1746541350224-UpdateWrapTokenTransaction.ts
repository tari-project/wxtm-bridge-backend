import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransaction1746541350224
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransaction1746541350224';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "feePercentageBps" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "feeAmount" numeric(38,0) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "amountAfterFee" numeric(38,0) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "amountAfterFee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "feeAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "feePercentageBps"`,
    );
  }
}
