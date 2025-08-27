import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSettings1756302390940 implements MigrationInterface {
  name = 'UpdateSettings1756302390940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "approvingUserId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "unwrapManualApprovalThreshold" numeric(38,0) NOT NULL DEFAULT '100000000000000000000000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD CONSTRAINT "FK_38eae6c6908439479fbbeca7018" FOREIGN KEY ("approvingUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP CONSTRAINT "FK_38eae6c6908439479fbbeca7018"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "unwrapManualApprovalThreshold"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "approvingUserId"`,
    );
  }
}
