import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWrapTokenTransaction1745419051972 implements MigrationInterface {
    name = 'UpdateWrapTokenTransaction1745419051972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" ADD CONSTRAINT "UQ_2bf904c2fbd071df44abc3e7650" UNIQUE ("paymentId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wrap_token_transactions" DROP CONSTRAINT "UQ_2bf904c2fbd071df44abc3e7650"`);
    }

}
