import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransaction1751290520200
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransaction1751290520200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "safeAddress" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "safeAddress"`,
    );
  }
}
