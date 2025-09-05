import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTokenWrapedStatus1757073237451
  implements MigrationInterface
{
  name = 'UpdateTokenWrapedStatus1757073237451';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_audits_fromstatus_enum" RENAME TO "tokens_unwrapped_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_audits_fromstatus_enum" AS ENUM('created', 'created_unprocessable', 'awaiting_confirmation', 'awaiting_confirmation_unprocessable', 'confirmed', 'confirmed_awaiting_approval', 'confirmed_unprocessable', 'init_send_tokens', 'sending_tokens', 'sending_tokens_unprocessable', 'tokens_sent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped_audits" ALTER COLUMN "fromStatus" TYPE "public"."tokens_unwrapped_audits_fromstatus_enum" USING "fromStatus"::"text"::"public"."tokens_unwrapped_audits_fromstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_audits_tostatus_enum" RENAME TO "tokens_unwrapped_audits_tostatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_audits_tostatus_enum" AS ENUM('created', 'created_unprocessable', 'awaiting_confirmation', 'awaiting_confirmation_unprocessable', 'confirmed', 'confirmed_awaiting_approval', 'confirmed_unprocessable', 'init_send_tokens', 'sending_tokens', 'sending_tokens_unprocessable', 'tokens_sent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped_audits" ALTER COLUMN "toStatus" TYPE "public"."tokens_unwrapped_audits_tostatus_enum" USING "toStatus"::"text"::"public"."tokens_unwrapped_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_audits_tostatus_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_status_enum" RENAME TO "tokens_unwrapped_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_status_enum" AS ENUM('created', 'created_unprocessable', 'awaiting_confirmation', 'awaiting_confirmation_unprocessable', 'confirmed', 'confirmed_awaiting_approval', 'confirmed_unprocessable', 'init_send_tokens', 'sending_tokens', 'sending_tokens_unprocessable', 'tokens_sent')`,
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
      `CREATE TYPE "public"."tokens_unwrapped_status_enum_old" AS ENUM('awaiting_confirmation', 'confirmed', 'confirmed_awaiting_approval', 'created', 'init_send_tokens', 'sending_tokens', 'tokens_sent', 'unprocessable')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" TYPE "public"."tokens_unwrapped_status_enum_old" USING "status"::"text"::"public"."tokens_unwrapped_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" SET DEFAULT 'created'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_status_enum_old" RENAME TO "tokens_unwrapped_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_audits_tostatus_enum_old" AS ENUM('awaiting_confirmation', 'confirmed', 'confirmed_awaiting_approval', 'created', 'init_send_tokens', 'sending_tokens', 'tokens_sent', 'unprocessable')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped_audits" ALTER COLUMN "toStatus" TYPE "public"."tokens_unwrapped_audits_tostatus_enum_old" USING "toStatus"::"text"::"public"."tokens_unwrapped_audits_tostatus_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_audits_tostatus_enum_old" RENAME TO "tokens_unwrapped_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_audits_fromstatus_enum_old" AS ENUM('awaiting_confirmation', 'confirmed', 'confirmed_awaiting_approval', 'created', 'init_send_tokens', 'sending_tokens', 'tokens_sent', 'unprocessable')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped_audits" ALTER COLUMN "fromStatus" TYPE "public"."tokens_unwrapped_audits_fromstatus_enum_old" USING "fromStatus"::"text"::"public"."tokens_unwrapped_audits_fromstatus_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_audits_fromstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."tokens_unwrapped_audits_fromstatus_enum_old" RENAME TO "tokens_unwrapped_audits_fromstatus_enum"`,
    );
  }
}
