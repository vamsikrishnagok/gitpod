import { injectable } from "inversify";
import * as express from 'express';

@injectable()
export class SubscriptionController {
    get apiRouter(): express.Router {
        const router = express.Router();

        router.get("/unsubscribe", async (req: express.Request, res: express.Response) => {

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