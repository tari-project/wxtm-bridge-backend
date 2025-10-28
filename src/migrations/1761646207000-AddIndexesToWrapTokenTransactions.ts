import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToWrapTokenTransactions1761646207000
  implements MigrationInterface
{
  name = 'AddIndexesToWrapTokenTransactions1761646207000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for queries filtering by status and updatedAt
    await queryRunner.query(
      `CREATE INDEX "IDX_wrap_token_transactions_status_updatedAt" ON "wrap_token_transactions" ("status", "updatedAt");`,
    );

    // Index for queries filtering by origin and tariBlockHeight
    await queryRunner.query(
      `CREATE INDEX "IDX_wrap_token_transactions_origin_tariBlockHeight" ON "wrap_token_transactions" ("origin", "tariBlockHeight" DESC);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_wrap_token_transactions_origin_tariBlockHeight";`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_wrap_token_transactions_status_updatedAt";`,
    );
  }
}
