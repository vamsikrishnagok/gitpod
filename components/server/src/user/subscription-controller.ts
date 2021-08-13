/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { injectable } from "inversify";
import * as express from 'express';

@injectable()
export class SubscriptionController {
    get apiRouter(): express.Router {
        const router = express.Router();

        router.get("/unsubscribe", async (req: express.Request, res: express.Response) => {

            console.log("Subscription controller");
            // if emailAddress exists in User database:
            //      1. update the database
            //      2. send track event
            //      3. redirect to page
            // if does not exist:
            //        1. send track event
            //      2. redirect to page

        })

        return router;
    }
}