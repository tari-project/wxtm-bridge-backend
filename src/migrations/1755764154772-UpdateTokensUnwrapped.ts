import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTokensUnwrapped1755764154772 implements MigrationInterface {
  name = 'UpdateTokensUnwrapped1755764154772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "tokens_unwrapped"`);
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "nonce" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD CONSTRAINT "UQ_1d99825ac88409ae3a5a3422f89" UNIQUE ("nonce")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "subgraphId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "subgraphId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD CONSTRAINT "UQ_a3f27c4c91834ecc3b0371a041a" UNIQUE ("subgraphId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP CONSTRAINT "UQ_a3f27c4c91834ecc3b0371a041a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "subgraphId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "subgraphId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP CONSTRAINT "UQ_1d99825ac88409ae3a5a3422f89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "nonce"`,
    );
  }
}
