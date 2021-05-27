/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { MigrationInterface, QueryRunner } from "typeorm";
import { tableExists, columnExists } from "./helper/helper";

export class AlterClusterTable1621856088352 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        if (await tableExists(queryRunner, "d_b_workspace_cluster")) {
            if (!(await columnExists(queryRunner, "d_b_workspace_cluster", "annotations"))) {
                await queryRunner.query("ALTER TABLE `d_b_workspace_cluster` ADD COLUMN annotations JSON");
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
    }

}
