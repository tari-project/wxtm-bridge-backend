import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTokensUnwrappedAudit1756137029079
  implements MigrationInterface
{
  name = 'CreateTokensUnwrappedAudit1756137029079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_audits_fromstatus_enum" AS ENUM('created', 'awaiting_confirmation', 'confirmed', 'confirmed_awaiting_approval', 'sending_tokens', 'tokens_sent', 'unprocessable')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tokens_unwrapped_audits_tostatus_enum" AS ENUM('created', 'awaiting_confirmation', 'confirmed', 'confirmed_awaiting_approval', 'sending_tokens', 'tokens_sent', 'unprocessable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tokens_unwrapped_audits" ("id" SERIAL NOT NULL, "paymentId" uuid NOT NULL, "fromStatus" "public"."tokens_unwrapped_audits_fromstatus_enum", "toStatus" "public"."tokens_unwrapped_audits_tostatus_enum", "note" jsonb, "transactionId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f868258b1a2959cf84acbb2d4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "signature" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "contractAddress" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "feePercentageBps" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "feeAmount" numeric(38,0) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "amountAfterFee" numeric(38,0) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD "blockHash" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" ADD CONSTRAINT "UQ_0f7526c5ca548251f922b1cebde" UNIQUE ("blockHash")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped_audits" ADD CONSTRAINT "FK_19764ec512a9cfee47a947017c6" FOREIGN KEY ("transactionId") REFERENCES "tokens_unwrapped"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped_audits" DROP CONSTRAINT "FK_19764ec512a9cfee47a947017c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP CONSTRAINT "UQ_0f7526c5ca548251f922b1cebde"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "blockHash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "amountAfterFee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "feeAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "feePercentageBps"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "contractAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens_unwrapped" DROP COLUMN "signature"`,
    );
    await queryRunner.query(`DROP TABLE "tokens_unwrapped_audits"`);
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_audits_tostatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tokens_unwrapped_audits_fromstatus_enum"`,
    );
  }
}
