import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTokensUnwrapped1755095586551 implements MigrationInterface {
  name = 'UpdateTokensUnwrapped1755095586551';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_status_enum" RENAME TO "tokens_unwrapped_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_status_enum" AS ENUM('created', 'awaiting_confirmation', 'confirmed', 'tokens_burned', 'tokens_minted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" TYPE "public"."tokens_unwrapped_status_enum" USING "status"::"text"::"public"."tokens_unwrapped_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" SET DEFAULT 'created'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_status_enum_old" AS ENUM('tokens_burned', 'tokens_minted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" TYPE "public"."tokens_unwrapped_status_enum_old" USING "status"::"text"::"public"."tokens_unwrapped_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" SET DEFAULT 'tokens_burned'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_status_enum_old" RENAME TO "tokens_unwrapped_status_enum"`,
    );
  }
}
