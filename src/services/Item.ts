import * as moment from "moment";
import { getConnection } from "typeorm";
import { Item } from "../entity";
import { ItemRepository } from "../repository/ItemRepository";
import * as Util from "../utils/service";
import * as B2B_SERVICE from "./external/B2B";
import * as ITEM_SERVICE from "./external/Item";
// import * as MASTER_SERVICE from "./external/Master";

import { IToma } from "./external/SUPI";

export interface IItemsAction {
  flag: boolean;
  data: Array<{
    ean: number;
    descripcion: string;
    stock_transito?: number;
    sventa: number;
    cadem: number;
    gestionado: number;
  }>;
}

export class ItemService {
  public async listItems(
    client: string,
    storeId: string,
    retail: string,
    folio: number,
    date: string,
    ultimoQuiereCademSmartYquiebreConsecutivo: any
  ): Promise<Item[]> {
    const detail = await B2B_SERVICE.detailItems(
      client,
      storeId,
      retail,
      date /* "2021-03-30" */
    );
    const detailItems: Item[] = [];

    await Promise.all(
      detail.map(async (item) => {
        const detailMaster = await ITEM_SERVICE.detailItem(client, item.ean);
        const newItem = new Item();
        newItem.folio = folio;
        newItem.ean = item.ean;
        newItem.plu = item.plu;
        newItem.stock = item.stock;
        newItem.stockPedidoTienda = item.stockPedidoTienda;
        newItem.diasSinVenta = item.diasSinVenta;
        newItem.ventaUnidades = item.ventaUnidades;

        // Ultimos quiebres
        const found = ultimoQuiereCademSmartYquiebreConsecutivo.find(
          (element) => {
            return element.EAN == item.ean;
          }
        );

        if (found) {
          newItem.uqc = found.UQC
            ? moment(found.UQC).format("YYYY-MM-DD")
            : "-";

          newItem.qc = found.QUIEBRE_CONSECUTIVO
            ? found.QUIEBRE_CONSECUTIVO
            : "-";
        } else {
          newItem.uqc = "-";
          newItem.qc = "-";
        }

        if (
          parseInt(item.stock.toString()) === 0 ||
          item.stock === null ||
          item.stock === undefined
        ) {
          newItem.accion = "Chequear pedidos";
        } else if (parseInt(item.stock.toString()) < 0) {
          newItem.accion = "Ajustar";
        } else {
          const dateStaticStock = moment(date)
            .subtract(7, "days")
            .format("YYYY-MM-DD");
          const staticStock = await B2B_SERVICE.staticStock(
            client,
            storeId,
            item.itemId,
            dateStaticStock
          );
          if (staticStock) {
            newItem.accion = "Ajustar";
          } else {
            newItem.accion = "Reponer";
          }
        }
        newItem.ventaPerdida = item.promedioVentas;
        if (detailMaster) {
          newItem.description = detailMaster.description;
          newItem.category = detailMaster.category;
        } else {
          newItem.description = "OTROS";
          newItem.category = "OTROS";
        }
        detailItems.push(newItem);
      })
    );

    return detailItems;
  }

  public setPresenciaCadem(items: Item[], toma: IToma[]): Item[] {
    return items.map((item) => {
      const tomaItem = toma.find((row) => Number(row.ean) === item.ean);
      if (tomaItem) {
        item.cadem = Number(tomaItem.valor);
      }
      return item;
    });
  }

  public totalVentaPerdida(items: Item[]): number {
    return Util.sumBy(items, "ventaPerdida");
  }

  public async detailItemsAction(
    client: string,
    folio: number,
    category: string,
    action: string
  ): Promise<IItemsAction> {
    return getConnection(client)
      .getCustomRepository(ItemRepository)
      .findByAction(folio, category, action)
      .then((Items) => {
        if (action === "Chequear pedidos") {
          return {
            data: Items.map((item) => {
              return {
                cadem: item.cadem,
                descripcion: item.description,
                ean: item.ean,
                stock_transito: item.stock_pedido_tienda,
                sventa: Number(item.dias_sin_venta),
                venta_perdida: item.venta_perdida,
                gestionado: Number(item.gestionado),
              };
            }),
            flag: true,
          };
        } else {
          return {
            data: Items.map((item) => {
              return {
                cadem: item.cadem,
                descripcion: item.description,
                ean: item.ean,
                stock: item.stock,
                sventa: Number(item.dias_sin_venta),
                venta_perdida: item.venta_perdida,
                gestionado: Number(item.gestionado),
              };
            }),
            flag: false,
          };
        }
      });
  }
}
