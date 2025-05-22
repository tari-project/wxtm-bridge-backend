import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWrapTokenEntity1747945667659 implements MigrationInterface {
    name = 'UpdateWrapTokenEntity1747945667659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" RENAME COLUMN "tariTxId" TO "tariPaymentIdHex"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" RENAME COLUMN "tariPaymentIdHex" TO "tariTxId"`);
    }

}
