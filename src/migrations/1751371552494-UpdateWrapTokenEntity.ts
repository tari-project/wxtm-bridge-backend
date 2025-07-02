import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenEntity1751371552494 implements MigrationInterface {
  name = 'UpdateWrapTokenEntity1751371552494';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "error"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "error" jsonb`,
    );
  }
}
