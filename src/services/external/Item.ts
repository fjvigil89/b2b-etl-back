import { B2B } from "../../config/database";

export function detailItem(client: string, ean: number): Promise<{ description: string, category: string } | null> {
    return B2B[client].then((conn) => conn.query(`
      SELECT i_item as description, i_categoria as category
      FROM item_master
      WHERE i_ean =  ${ean}
    `)).then((result) => result.length ? result[0] : null);
}
