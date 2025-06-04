import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWrapTokenAuditEntity1749030782215
  implements MigrationInterface
{
  name = 'CreateWrapTokenAuditEntity1749030782215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_audits_fromstatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_audits_tostatus_enum" AS ENUM('created', 'tokens_sent', 'tokens_received', 'tokens_received_with_mismatch', 'creating_safe_transaction', 'safe_transaction_created', 'executing_safe_transaction', 'safe_transaction_executed', 'timeout')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wrap_token_audits" ("id" SERIAL NOT NULL, "paymentId" uuid NOT NULL, "fromStatus" "public"."wrap_token_audits_fromstatus_enum", "toStatus" "public"."wrap_token_audits_tostatus_enum", "note" jsonb, "transactionId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_99c5c16b9862e11fd70ee68beff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "wrap_token_audits" ADD CONSTRAINT "FK_171847d2d3441a0bbeb3549f130" FOREIGN KEY ("transactionId") REFERENCES "wrap_token_transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wrap_token_audits" DROP CONSTRAINT "FK_171847d2d3441a0bbeb3549f130"`,
    );
    await queryRunner.query(`DROP TABLE "wrap_token_audits"`);
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_audits_fromstatus_enum"`,
    );
  }
}
