import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateWrapTokenTransaction1747401284670
  implements MigrationInterface
{
  name = 'UpdateWrapTokenTransaction1747401284670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "userProvidedTokenAmount" numeric(38,0) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tariTxId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" ADD "tariTxTimestamp" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tariTxTimestamp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "tariTxId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_transactions" DROP COLUMN "userProvidedTokenAmount"`,
    );
  }
}
