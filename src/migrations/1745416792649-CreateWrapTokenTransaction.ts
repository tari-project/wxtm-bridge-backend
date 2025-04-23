import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWrapTokenTransaction1745416792649
  implements MigrationInterface
{
  name = 'CreateWrapTokenTransaction1745416792649';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."wrap_token_transactions_status_enum" AS ENUM('created', 'tokens_sent', 'tokens_received')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wrap_token_transactions" ("id" SERIAL NOT NULL, "paymentId" uuid NOT NULL DEFAULT uuid_generate_v4(), "from" character varying NOT NULL, "to" character varying NOT NULL, "tokenAmount" numeric(38,0) NOT NULL, "status" "public"."wrap_token_transactions_status_enum" NOT NULL DEFAULT 'created', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25ac9ec507e3f2498e11bb3f8ae" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wrap_token_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."wrap_token_transactions_status_enum"`,
    );
  }
}
