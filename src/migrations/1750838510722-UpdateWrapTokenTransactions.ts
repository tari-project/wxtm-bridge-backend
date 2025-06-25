import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransactions1750838510722
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransactions1750838510722';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "debug" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "debug"`,
    );
  }
}
