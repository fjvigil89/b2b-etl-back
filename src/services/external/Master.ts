import { MASTER } from "../../config/database";

export interface IStoreMaster {
    folio: number;
    cod_local: string;
    direccion: string;
    bandera: string;
    cadena: string;
    latitud: string;
    longitud: string;
    descripcion: string;
}

export function findStore(storeId: any, retail: string): Promise<IStoreMaster> {
    return MASTER.then((conn) => conn.query(`
            SELECT a.id as folio
                , a.descripcion
                , cod_local
                , direccion
                , b.nombre as bandera
                , c.nombre AS cadena
                , a.longitud
                , a.latitud
            FROM Store_Master a
            INNER JOIN STR_Bandera b ON a.id_bandera = b.id
            INNER JOIN STR_Cadena c ON b.id_cadena = c.id
            WHERE cod_local = "${storeId}"
                AND c.nombre = "${retail}"
        `))
            .then((result) => {
                if (result.length) {
                    return result[0];
                } else {
                    return { folio: null, cod_local: null, descripcion: null, direccion: null, cadena: null };
                }
            });
}

export function findStore2(allStore: string[]): Promise<IStoreMaster[]> {
    return MASTER.then((conn) => conn.query(`
            SELECT a.id as folio
                , a.descripcion
                , cod_local
                , direccion
                , b.nombre as bandera
                , c.nombre AS cadena
                , a.longitud
                , a.latitud
            FROM Store_Master a
            INNER JOIN STR_Bandera b ON a.id_bandera = b.id
            INNER JOIN STR_Cadena c ON b.id_cadena = c.id
            WHERE (cod_local, c.nombre) IN (${allStore})
        `))
            .then((result) => JSON.parse(JSON.stringify(result)));
}

export function findStores(): Promise<any[]> {
    return MASTER.then((conn) => conn.query(`
        SELECT a.id as folio
            , a.descripcion
            , cod_local
            , direccion
            , b.nombre as bandera
            , c.nombre AS cadena
            , a.longitud
            , a.latitud
            , c.nombre as retail
            , a.cod_local
        FROM Store_Master a
        INNER JOIN STR_Bandera b ON a.id_bandera = b.id
        INNER JOIN STR_Cadena c ON b.id_cadena = c.id
        WHERE cod_local is NOT NULL
    `));
}

export function detailItem(ean: number): Promise<{ description: string, category: string } | null> {
    return MASTER.then((conn) => conn.query(`
        SELECT a.descripcion as description
            , b.descripcion as category
        FROM Item_Master a
        INNER JOIN ITM_Categoria b ON a.id_categoria = b.id
        WHERE a.id = ${ean}
    `)).then((result) => result.length ? result[0] : null);
}
