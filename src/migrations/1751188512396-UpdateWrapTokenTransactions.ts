import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransactions1751188512396
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransactions1751188512396';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "transactionHash" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "transactionHash"`,
    );
  }
}
