import * as moment from "moment";
import { getConnection } from "typeorm";
import { StoreRepository, SummaryRepository } from "../repository";
import * as Util from "../utils/service";

export class SummaryService {
  public async summaryList(
    client: string,
    userId: string,
    range: string
  ): Promise<any> {
    const customRepository =
      getConnection(client).getCustomRepository(SummaryRepository);
    const [
      summary,
      storeClose,
      storeOpen,
      totalCurrent,
      newsItems,
      invalidVariation,
      vPerdida,
      invalidTotal,
      updatesDate,
    ] = await Promise.all([
      customRepository.summaryByRange(userId, range),
      customRepository.storeVariationClose(userId, range),
      customRepository.storeVariationOpen(userId, range),
      customRepository.totalCurrent(userId, range),
      customRepository.newItemsVariation(userId, range),
      customRepository.invalidVariation(userId, range),
      customRepository.groupActions(userId, range),
      customRepository.totalInvalidItems(userId, range),
      getConnection(client).getCustomRepository(StoreRepository).updateDates(),
    ]);

    const banderas = summary.map((row) => {
      const totalOpen = storeOpen.find(
        (store) => store.bandera === row.bandera
      );
      const updateDate = updatesDate.find(
        (bandera) => bandera.nombre === row.bandera
      );
      const totalClose = storeClose.find(
        (store) => store.bandera === row.bandera
      );
      const newsItem = newsItems.find((item) => row.bandera === item.bandera);
      const invalidItems = invalidVariation.find(
        (item) => item.bandera === row.bandera
      );

      let mismasSalas = 0;
      mismasSalas -= totalClose ? Number(totalClose.total) : 0;
      mismasSalas += totalOpen ? Number(totalOpen.total) : 0;
      mismasSalas -= invalidItems ? Number(invalidItems.venta_total) : 0;
      mismasSalas += newsItem ? Number(newsItem.venta_total) : 0;

      const totalInvalid = invalidTotal.find(
        (rowInvalid) => rowInvalid.bandera === row.bandera
      );

      const acciones: any = Util.mapKeys(
        vPerdida.filter(
          (rowVentaPerdida) => rowVentaPerdida.bandera === row.bandera
        ),
        "accion"
      );

      return {
        nombre: row.bandera,
        fecha_actualizacion: updateDate.fecha,
        ventas: {
          causas: {
            mismas_salas: row.diff_venta_absoluta - mismasSalas,
            productos_descatalogados: invalidItems
              ? -Number(invalidItems.venta_total)
              : 0,
            productos_nuevos: newsItem ? Number(newsItem.venta_total) : 0,
            salas_cerradas: totalClose ? -Number(totalClose.total) : 0,
            salas_nuevas: totalOpen ? Number(totalOpen.total) : 0,
          },
          total: row.ventas_totales_actual,
          variacion: `${Number(row.ventas_totales_variacion).toFixed(1)}%`,
        },
        ventas_perdidas: {
          causas: {
            chequear_pedidos: acciones["Chequear pedidos"]
              ? Number(acciones["Chequear pedidos"].venta_perdida)
              : 0,
            desajuste_stock: acciones.Ajustar
              ? Number(acciones.Ajustar.venta_perdida)
              : 0,
            productos_descatalogados: totalInvalid
              ? Number(totalInvalid.total)
              : 0,
            reposicion: acciones.Revisar
              ? Number(acciones.Revisar.venta_perdida)
              : 0,
          },
          total: row.venta_perdida_actual,
          variacion: `${Number(row.venta_perdida_variacion).toFixed(1)}%`,
        },
      };
    });

    return {
      fecha_periodo: this.getPeriod(range),
      banderas,
      ...totalCurrent,
    };
  }

  private getPeriod(range: string): { actual: string; anterior: string } {
    moment.locale("es");
    switch (range) {
      case "day": {
        return {
          actual: moment().subtract(1, "days").format("YYYY-MM-DD"),
          anterior: moment()
            .subtract(1, "days")
            .subtract(1, "week")
            .format("YYYY-MM-DD"),
        };
      }
      case "week": {
        return {
          actual: moment()
            .subtract(1, "days")
            .startOf("week")
            .format("YYYY-MM-DD"),
          anterior: moment()
            .subtract(1, "days")
            .subtract(1, "week")
            .startOf("week")
            .format("YYYY-MM-DD"),
        };
      }
      case "month": {
        return {
          actual: moment()
            .subtract(1, "days")
            .startOf("month")
            .format("YYYY-MM-DD"),
          anterior: moment()
            .subtract(1, "days")
            .subtract(1, "month")
            .startOf("month")
            .format("YYYY-MM-DD"),
        };
      }
    }
  }
}
