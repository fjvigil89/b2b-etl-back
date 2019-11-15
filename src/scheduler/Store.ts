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
import * as Util from "../utils/service";

// CronJobs
export const StoreSchedulerICB = new CronJob("40 */1 * * * *", async () => {
    await syncStoreB2B("icb");
}, null, null, "America/Santiago");

export const StoreSchedulerPERNOD = new CronJob("10 */1 * * * *", async () => {
    await syncStoreB2B("pernod");
}, null, null, "America/Santiago");

export const StoreSchedulerANDINA = new CronJob("5 */1 * * * *", async () => {
    await syncStoreB2B("andina");
}, null, null, "America/Santiago");

const itemService = new ItemService();

export async function syncStoreB2B(client: string): Promise<void> {
    await Connection;
    const retail = await B2B_SERVICE.getGeneralPending(client);
    if (retail) {
        console.log("SINCRONIZANDO", retail);
        await B2B_SERVICE.startSyncGeneral(client, retail);
        const folios: string[] = await getConnection(client).getCustomRepository(StoreRepository).listStore();
        const ListStore = await B2B_SERVICE.lastStoreByDate(client);
        const localRetail = ListStore.map((store) => `('${store.codLocal}', '${store.retail}')`);

        // Buscar en Store master solo las salas que esten en la aplicacion vigente
        const allStoreMaster = await MASTER_SERVICE.findStore2(localRetail);

        // Ultimas visitas reportadas por SUPI en base a las salas disponibles en la aplicacion
        const allUltimasVisitas = await SUPI_SERVICE.visitaCadem(folios);

        for (const chunk of Util.chunk(allStoreMaster, 100)) {
            await Promise.all(chunk.map((store) => storeProcessv2(client, ListStore, store, allUltimasVisitas)));
        }

        await summaryProcess(client);
        await B2B_SERVICE.resetGeneralPending(client, retail);
        await B2B_SERVICE.stopSyncGeneral(client, retail);
    }
}

const storeProcessv2 = async (client, ListStore, storeMaster, allUltimasVisitas) => {
    // Busca la sala B2B
    const storeB2B = ListStore.find((store) =>
        store.codLocal === storeMaster.cod_local && store.retail === storeMaster.cadena);
    // Format dates
    storeB2B.actualizacion_b2b = moment(storeB2B.actualizacion_b2b).format("YYYY-MM-DD");
    storeB2B.fecha_sin_venta = moment(storeB2B.fecha_sin_venta).format("YYYY-MM-DD");

    // Actualizar fecha b2b????
    if (!storeB2B.fecha_sin_venta) {
    await getConnection(client)
        .getCustomRepository(StoreRepository)
        .updateDateB2b(storeB2B.actualizacion_b2b, storeMaster.folio);
    }
    // Busca si tiene visitas
    const visitaSUPI = allUltimasVisitas.find((visita) => Number(visita.folio) === Number(storeMaster.folio));

    const newStore = new Store();
    newStore.folio = storeMaster.folio;
    newStore.codLocal = storeMaster.cod_local ? storeMaster.cod_local : storeB2B.codLocal;
    newStore.bandera = storeMaster.bandera;
    newStore.direccion = storeMaster.direccion;
    newStore.cadena = storeMaster.cadena === "GRUPO FALABELLA" ? "TOTTUS" : storeMaster.cadena;
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

    let Items = await itemService.listItems(
    client, storeB2B.codLocal, storeB2B.retail, storeMaster.folio, storeB2B.fecha_sin_venta);
    if (visitaSUPI && visitaSUPI.realizada) {
        const toma = await SUPI_SERVICE.tomaVisita(visitaSUPI.id_visita);
        Items = itemService.setPresenciaCadem(Items, toma);
        newStore.osa = SUPI_SERVICE.OSA(toma);
    }

    newStore.ventaPerdida = itemService.totalVentaPerdida(Items);
    await Promise.all([
        getConnection(client).getCustomRepository(ItemRepository).removeByStore(storeMaster.folio),
        getConnection(client).getCustomRepository(StoreRepository).removeByStoreId(storeMaster.folio),
    ]);

    if (Items.length > 0) {
        await getConnection(client).getCustomRepository(ItemRepository).bulkCreate(client, Items);
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
                return row.retail === current.retail && row.cod_local === current.cod_local;
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
                if (Number(movItemStore.ventaPerdida) === 0) {
                    movItemStore.accion = null;
                } else if (current.stock === 0) {
                    movItemStore.accion = "Chequear pedidos";
                } else if (current.stock < 0) {
                    movItemStore.accion = "Ajustar";
                } else {
                    movItemStore.accion = "Reponer";
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
        initBeforeMonth, initBeforeWeek, initBeforeDay, finishBeforeMonth, finishBeforeWeek, finishBeforeDay,
        initThisMonth, initThisWeek, initThisDay, finishCurrentMonth, finishCurrentWeek, finishCurrentDay,
    ] = [
            moment().subtract(1, "days").subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
            moment().subtract(1, "days").subtract(1, "week").startOf("week").format("YYYY-MM-DD"),
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
