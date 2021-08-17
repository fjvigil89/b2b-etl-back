import * as dotenv from "dotenv";
import { resolve } from "path";

import {
  StoreSchedulerABI,
  StoreSchedulerANDINA,
  StoreSchedulerICB,
  StoreSchedulerPERNOD,
  StoreSchedulerCIAL,
  StoreSchedulerEMBONOR,
} from "./scheduler";
import { syncStoreB2B } from "./scheduler/Store";

process.on("unhandledRejection", (reason, promise) => {
  promise.catch((err) => console.log(err));
});

console.log("[INFO] Cargando archivo de producción");

dotenv.config({ path: resolve() + "/.env" });

StoreSchedulerABI.start();
// StoreSchedulerICB.start();
// StoreSchedulerPERNOD.start();
StoreSchedulerANDINA.start();
StoreSchedulerCIAL.start();
StoreSchedulerEMBONOR.start();

async function ejecucionManual() {
  await syncStoreB2B("embonor");
}

// ejecucionManual();
