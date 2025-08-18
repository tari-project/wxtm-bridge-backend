import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUnwrappedTokens1755533252853 implements MigrationInterface {
  name = 'UpdateUnwrappedTokens1755533252853';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "tokens_unwrapped"`);
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "nonce" numeric(38,0) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "nonce"`,
    );
  }
}
