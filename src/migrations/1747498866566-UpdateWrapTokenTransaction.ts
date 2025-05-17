import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransaction1747498866566
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransaction1747498866566';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "error" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "error"`,
    );
  }
}
