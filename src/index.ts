import * as dotenv from "dotenv";
import { resolve } from "path";

import {
    StoreSchedulerABI,
    StoreSchedulerANDINA,
    StoreSchedulerICB,
    StoreSchedulerPERNOD,
} from "./scheduler";

process.on("unhandledRejection", (reason, promise) => {
    promise.catch((err) => console.log(err));
});

console.log("[INFO] Cargando archivo de producción");
dotenv.config({ path: resolve() + "/.env" });

StoreSchedulerABI.start();
StoreSchedulerICB.start();
StoreSchedulerPERNOD.start();
StoreSchedulerANDINA.start();
