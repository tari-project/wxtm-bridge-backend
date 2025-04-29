import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnwrapedTransactions1745917246117
  implements MigrationInterface
{
  name = 'CreateUnwrapedTransactions1745917246117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tokens_unwrapped" ("id" SERIAL NOT NULL, "subgraphId" integer NOT NULL, "from" character varying NOT NULL, "targetTariAddress" character varying NOT NULL, "amount" numeric(38,0) NOT NULL, "blockNumber" integer NOT NULL, "blockTimestamp" TIMESTAMP NOT NULL, "transactionHash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_21faf8754349e26ceb2c49dd214" UNIQUE ("transactionHash"), CONSTRAINT "PK_2f43f30a9343252bd5ec7f62944" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tokens_unwrapped"`);
  }
}
