import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentWalletBalance1757412136057
  implements MigrationInterface
{
  name = 'CreatePaymentWalletBalance1757412136057';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_wallet_balance" ("id" integer NOT NULL DEFAULT '1', "availableBalance" numeric(38,0) NOT NULL DEFAULT '0', "pendingOutgoingBalance" numeric(38,0) NOT NULL DEFAULT '0', "pendingIncomingBalance" numeric(38,0) NOT NULL DEFAULT '0', "timelockedBalance" numeric(38,0) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6e3dab198d1ae91622dbb7d3098" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `INSERT INTO "payment_wallet_balance" ("id") VALUES (1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_wallet_balance"`);
  }
}
