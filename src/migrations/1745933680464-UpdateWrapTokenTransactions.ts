import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransactions1745933680464
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransactions1745933680464';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "safeTxHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "safeNonce" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "safeNonce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "safeTxHash"`,
    );
  }
}
