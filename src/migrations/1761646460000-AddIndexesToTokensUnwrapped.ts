import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToTokensUnwrapped1761646460000
  implements MigrationInterface
{
  name = 'AddIndexesToTokensUnwrapped1761646460000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for queries filtering by status and sorting by nonce
    await queryRunner.query(
      `CREATE INDEX "IDX_tokens_unwrapped_status_nonce" ON "tokens_unwrapped" ("status", "nonce");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tokens_unwrapped_status_nonce";`,
    );
  }
}
