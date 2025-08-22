import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTokensUnwrapped1755854274331 implements MigrationInterface {
    name = 'UpdateTokensUnwrapped1755854274331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ADD "paymentId" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ADD CONSTRAINT "UQ_6251de82bb857c0925d409a62a5" UNIQUE ("paymentId")`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ADD "error" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ADD "isErrorNotificationSent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."tokens_unwrapped_status_enum" RENAME TO "tokens_unwrapped_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tokens_unwrapped_status_enum" AS ENUM('created', 'awaiting_confirmation', 'confirmed', 'confirmed_awaiting_approval', 'sending_tokens', 'tokens_sent', 'unprocessable')`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" TYPE "public"."tokens_unwrapped_status_enum" USING "status"::"text"::"public"."tokens_unwrapped_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "public"."tokens_unwrapped_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tokens_unwrapped_status_enum_old" AS ENUM('awaiting_confirmation', 'confirmed', 'created', 'tokens_burned', 'tokens_minted')`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" TYPE "public"."tokens_unwrapped_status_enum_old" USING "status"::"text"::"public"."tokens_unwrapped_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" ALTER COLUMN "status" SET DEFAULT 'created'`);
        await queryRunner.query(`DROP TYPE "public"."tokens_unwrapped_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tokens_unwrapped_status_enum_old" RENAME TO "tokens_unwrapped_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" DROP COLUMN "isErrorNotificationSent"`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" DROP COLUMN "error"`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" DROP CONSTRAINT "UQ_6251de82bb857c0925d409a62a5"`);
        await queryRunner.query(`ALTER TABLE "tokens_unwrapped" DROP COLUMN "paymentId"`);
    }

}
