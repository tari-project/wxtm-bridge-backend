import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransaction1754298743019
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransaction1754298743019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" RENAME COLUMN "tariUserPaymentId" TO "incomingPaymentId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" RENAME COLUMN "incomingPaymentId" TO "tariUserPaymentId"`,
    );
  }
}
