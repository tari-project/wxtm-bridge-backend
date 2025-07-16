import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsEntity1752674186502 implements MigrationInterface {
  name = 'CreateSettingsEntity1752674186502';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."settings_wraptokensservicestatus_enum" AS ENUM('online', 'offline')`,
    );
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" integer NOT NULL DEFAULT '1', "wrapTokensServiceStatus" "public"."settings_wraptokensservicestatus_enum" NOT NULL DEFAULT 'online', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`INSERT INTO "settings" ("id") VALUES (1)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(
      `DROP TYPE "public"."settings_wraptokensservicestatus_enum"`,
    );
  }
}
