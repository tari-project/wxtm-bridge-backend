import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUser1744376790970 implements MigrationInterface {
  name = 'UpdateUser1744376790970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isAdmin" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isAdmin"`);
  }
}
