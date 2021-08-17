import { CronJob } from "cron";
import * as moment from "moment";
import { getConnection } from "typeorm";
import { Connection } from "../config/database";
import { Store, Summary } from "../entity";
import { ItemRepository, StoreRepository } from "../repository";
import { ItemService } from "../services";
import * as B2B_SERVICE from "../services/external/B2B";
import { summary } from "../services/external/B2B";
import * as MASTER_SERVICE from "../services/external/Master";
import { findStores } from "../services/external/Master";
import * as SUPI_SERVICE from "../services/external/SUPI";
import { NotificationService } from "../services/Notification";
import * as Util from "../utils/service";
import * as SMARTWEB_SERVICE from "../services/external/SmartWeb";

// CronJobs
export const StoreSchedulerICB = new CronJob(
  "40 */1 * * * *",
  async () => {
    await syncStoreB2B("icb");
  },
  null,
  null,
  "America/Santiago"
);

export const StoreSchedulerPERNOD = new CronJob(
  "10 */1 * * * *",
  async () => {
    await syncStoreB2B("pernod");
  },
  null,
  null,
  "America/Santiago"
);

export const StoreSchedulerANDINA = new CronJob(
  "20 */1 * * * *",
  async () => {
    await syncStoreB2B("andina");
  },
  null,
  null,
  "America/Santiago"
);

export const StoreSchedulerABI = new CronJob(
  "15 */1 * * * *",
  async () => {
    await syncStoreB2B("abi");
  },
  null,
  null,
  "America/Santiago"
);

export const StoreSchedulerCIAL = new CronJob(
  "30 */1 * * * *",
  async () => {
    await syncStoreB2B("cial");
  },
  null,
  null,
  "America/Santiago"
);

export const StoreSchedulerEMBONOR = new CronJob(
  "10 */1 * * * *",
  async () => {
    await syncStoreB2B("embonor");
  },
  null,
  null,
  "America/Santiago"
);

const itemService = new ItemService();
const notificationService = new NotificationService();

const ESTUDIOS_SUPI_CLIENTS = {
  andina: 438,
  abi: 480,
  pernod: 34,
  icb: 101,
  cial: 504,
  embonor: 525,
};

export async function syncStoreB2B(client: string): Promise<void> {
  await Connection;
  const retail = await B2B_SERVICE.getGeneralPending(client);

  if (retail) {
    console.log(`[INFO] SINCRONIZANDO ${client}-${retail}`);
    await B2B_SERVICE.startSyncGeneral(client, retail);

    const folios: string[] = await getConnection(client)
      .getCustomRepository(StoreRepository)
      .listStore();

    const ListStore = await B2B_SERVICE.lastStoreByDate(client);
    const localRetail = ListStore.map(
      (store) => `('${store.codLocal}', '${store.retail}')`
    );

    // Buscar en Store master solo las salas que esten en la aplicacion vigente
    console.log(`[INFO] GET INFO SALAS x SYNC | ${client}-${retail}`);
    const allStoreMaster = await MASTER_SERVICE.findStore2(localRetail);

    console.log(`[INFO] GET VISITAS x SALAS | ${client}-${retail}`);
    // Ultimas visitas reportadas por SUPI en base a las salas disponibles en la aplicacion
    const codigoEstudioSupi = ESTUDIOS_SUPI_CLIENTS[client];
    let allUltimasVisitas = [];
    if (codigoEstudioSupi) {
      allUltimasVisitas = await SUPI_SERVICE.visitaCadem(
        folios,
        codigoEstudioSupi
      );
    }

    for (const chunk of Util.chunk(allStoreMaster, 100)) {
      await Promise.all(
        chunk.map((store) =>
          storeProcessv2(client, ListStore, store, allUltimasVisitas)
        )
      );
    }

    console.log(`[INFO] ACTUALIZANDO RESUMEN | ${client}-${retail}`);
    await summaryProcess(client);
    console.log(`[INFO] RESTAURANDO GENERAL | ${client}-${retail}`);
    await B2B_SERVICE.resetGeneralPending(client, retail);
    await B2B_SERVICE.stopSyncGeneral(client, retail);

    if (
      await B2B_SERVICE.isRetailProcessedAndNotificationNotSent(client, retail)
    ) {
      console.log("[INFO] Enviando notificación");
      const tokens = await notificationService.getAllTokens(client);
      await notificationService.sendNotification(
        tokens,
        `Se actualizo la información del retail ${retail}`
      );
      await B2B_SERVICE.updateNotificationAppDate(client, retail);
    }

    console.log(`[INFO] SINCRONIZACION ${client}-${retail} FINALIZADA`);
  } else {
    console.log(`[INFO] NO HAY RETAIL POR SYNC EN: ${client}`);
  }
}

const storeProcessv2 = async (
  client,
  ListStore,
  storeMaster,
  allUltimasVisitas
) => {
  // Busca la sala B2B
  const storeB2B = ListStore.find(
    (store) =>
      store.codLocal === storeMaster.cod_local &&
      store.retail === storeMaster.cadena
  );
  // Format dates
  storeB2B.actualizacion_b2b = moment(storeB2B.actualizacion_b2b).format(
    "YYYY-MM-DD"
  );
  storeB2B.fecha_sin_venta = moment(storeB2B.fecha_sin_venta).format(
    "YYYY-MM-DD"
  );

  // Actualizar fecha b2b????
  if (!storeB2B.fecha_sin_venta) {
    await getConnection(client)
      .getCustomRepository(StoreRepository)
      .updateDateB2b(storeB2B.actualizacion_b2b, storeMaster.folio);
  }
  // Busca si tiene visitas
  const visitaSUPI = allUltimasVisitas.find(
    (visita) =>
      Number(visita.folio) === Number(storeMaster.folio /*"14065001"*/)
  );

  const newStore = new Store();
  newStore.folio = storeMaster.folio;
  newStore.codLocal = storeMaster.cod_local
    ? storeMaster.cod_local
    : storeB2B.codLocal;
  newStore.bandera = storeMaster.bandera;
  newStore.direccion = storeMaster.direccion;
  newStore.cadena =
    storeMaster.cadena === "GRUPO FALABELLA" ? "TOTTUS" : storeMaster.cadena;
  newStore.latitud = storeMaster.latitud;
  newStore.longitud = storeMaster.longitud;
  newStore.descripcion = storeMaster.descripcion;

  newStore.dateB2B = storeB2B.actualizacion_b2b;

  // Visita SUPI
  if (visitaSUPI) {
    newStore.idVisita = visitaSUPI.id_visita;
    newStore.mide = visitaSUPI.mide;
    newStore.realizada = visitaSUPI.realizada;
    newStore.fechaVisita = visitaSUPI.fecha_visita;
    newStore.pendiente = visitaSUPI.pendiente;
  }

  const ultimoQuiereCademSmartYquiebreConsecutivo =
    await SMARTWEB_SERVICE.ultimoQuiereCademSmartYquiebreConsecutivo(
      client,
      storeMaster.folio // "41065005"
    );

  let Items = await itemService.listItems(
    client,
    storeB2B.codLocal,
    storeB2B.retail,
    storeMaster.folio,
    storeB2B.fecha_sin_venta,
    ultimoQuiereCademSmartYquiebreConsecutivo
  );

  if (visitaSUPI && visitaSUPI.realizada) {
    const toma = await SUPI_SERVICE.tomaVisita(visitaSUPI.id_visita);
    Items = itemService.setPresenciaCadem(Items, toma);
    newStore.osa = SUPI_SERVICE.OSA(toma);
  }

  newStore.ventaPerdida = itemService.totalVentaPerdida(Items);
  await Promise.all([
    getConnection(client)
      .getCustomRepository(ItemRepository)
      .removeByStore(storeMaster.folio),
    getConnection(client)
      .getCustomRepository(StoreRepository)
      .removeByStoreId(storeMaster.folio),
  ]);

  if (Items.length > 0) {
    await getConnection(client)
      .getCustomRepository(ItemRepository)
      .bulkCreate(client, Items);
  }

  await getConnection(client).getRepository(Store).save(newStore);
};

async function summaryProcess(client: string): Promise<void> {
  moment.locale("es");
  const mov = await getSummary(client);
  const storeMaster = await findStores();
  await getConnection(client).getRepository(Summary).clear();
  for (const chunk of Util.chunk(mov, 5000)) {
    const resultMov: Summary[] = chunk.reduce((acc, current) => {
      const storeDetail = storeMaster.find((row) => {
        return (
          row.retail === current.retail && row.cod_local === current.cod_local
        );
      });
      if (storeDetail) {
        const movItemStore = new Summary();
        movItemStore.folio = storeDetail.folio;
        movItemStore.ean = current.ean;
        movItemStore.rangeDate = current.range_date;
        movItemStore.rangePosition = current.range_position;
        movItemStore.retail = current.retail;
        movItemStore.codLocal = current.cod_local;
        movItemStore.ventasTotales = current.ventas_totales;
        movItemStore.ventaPerdida = current.venta_perdida;
        movItemStore.itemValido = current.item_valido;
        movItemStore.ventasUnidades = current.venta_unidades;
        movItemStore.bandera = storeDetail.bandera;
        let stockSala = parseFloat(current.stock);
        if (Number(movItemStore.ventaPerdida) === 0) {
          movItemStore.accion = null;
        } else if (
          stockSala === 0 ||
          stockSala === null ||
          stockSala === undefined ||
          isNaN(stockSala)
        ) {
          movItemStore.accion = "Chequear pedidos";
        } else if (stockSala < 0) {
          movItemStore.accion = "Ajustar";
        } else {
          movItemStore.accion = "Revisar";
        }
        acc.push(movItemStore);
      }
      return acc;
    }, []);
    await Summary.bulkCreate(client, resultMov);
  }
}

function getSummary(client: string) {
  const [
    initBeforeMonth,
    initBeforeWeek,
    initBeforeDay,
    finishBeforeMonth,
    finishBeforeWeek,
    finishBeforeDay,
    initThisMonth,
    initThisWeek,
    initThisDay,
    finishCurrentMonth,
    finishCurrentWeek,
    finishCurrentDay,
  ] = [
    moment()
      .subtract(1, "days")
      .subtract(1, "month")
      .startOf("month")
      .format("YYYY-MM-DD"),
    moment()
      .subtract(1, "days")
      .subtract(1, "week")
      .startOf("week")
      .format("YYYY-MM-DD"),
    moment().subtract(1, "days").subtract(1, "week").format("YYYY-MM-DD"),
    moment().subtract(1, "days").subtract(1, "month").format("YYYY-MM-DD"),
    moment().subtract(1, "days").subtract(1, "week").format("YYYY-MM-DD"),
    moment().subtract(1, "days").subtract(1, "week").format("YYYY-MM-DD"),
    moment().subtract(1, "days").startOf("month").format("YYYY-MM-DD"),
    moment().subtract(1, "days").startOf("week").format("YYYY-MM-DD"),
    moment().subtract(1, "days").format("YYYY-MM-DD"),
    moment().subtract(1, "days").format("YYYY-MM-DD"),
    moment().subtract(1, "days").format("YYYY-MM-DD"),
    moment().subtract(1, "days").format("YYYY-MM-DD"),
  ];

  return Promise.all([
    summary(client, initBeforeMonth, finishBeforeMonth, "month", "before"),
    summary(client, initBeforeWeek, finishBeforeWeek, "week", "before"),
    summary(client, initBeforeDay, finishBeforeDay, "day", "before"),
    summary(client, initThisMonth, finishCurrentMonth, "month", "current"),
    summary(client, initThisWeek, finishCurrentWeek, "week", "current"),
    summary(client, initThisDay, finishCurrentDay, "day", "current"),
  ]).then((mov) => {
    return mov[0].concat(mov[1], mov[2], mov[3], mov[4], mov[5]);
  });
}
