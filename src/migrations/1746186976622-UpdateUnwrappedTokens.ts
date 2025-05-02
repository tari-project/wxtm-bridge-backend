import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUnwrappedTokens1746186976622 implements MigrationInterface {
  name = 'UpdateUnwrappedTokens1746186976622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_status_enum" AS ENUM('tokens_burned', 'tokens_minted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "status" "public"."tokens_unwrapped_status_enum" NOT NULL DEFAULT 'tokens_burned'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_status_enum"`,
    );
  }
}
