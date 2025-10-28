import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDailyWrapLimit1761642637075 implements MigrationInterface {
  name = 'AddDailyWrapLimit1761642637075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "wrapDailyLimit" numeric(38,0) NOT NULL DEFAULT '10000000000000000000000000'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "wrapDailyLimit"`,
    );
  }
}
