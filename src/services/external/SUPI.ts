import * as moment from "moment";
import { SUPI } from "../../config/database";

interface IdataCadem {
    id_visita: number;
    mide: number;
    realizada: number;
    fecha_visita: string;
    pendiente: number;
    folio: string;
}

export interface IToma {
    id_visita: number;
    ean: string;
    valor: string;
    categoria: string;
}

export async function visitaCadem(folios: string[], codigoEstudio: number): Promise<IdataCadem[]> {
    const REALIZADO = 4;
    const PENDIENTE = 1;

    const visitas = await ultimasVisitas(folios, codigoEstudio);

    const groupByFolio = {};
    for (const visita of visitas) {
        groupByFolio[visita.folio] = groupByFolio[visita.folio] ? groupByFolio[visita.folio] : [];
        groupByFolio[visita.folio].push(visita);
    }

    const result = [];
    for (const folio of Object.keys(groupByFolio)) {
        const cademResult = { id_visita: null, mide: 0, realizada: 0, fecha_visita: null, pendiente: 0, folio };
        for (const visita of groupByFolio[folio]) {
            if (visita.estado === REALIZADO) {
                if (!cademResult.id_visita) {
                    cademResult.id_visita = visita.id_visita;
                    cademResult.fecha_visita = visita.fecha;
                }
                cademResult.mide = 1;
                cademResult.realizada = 1;
            } else if (visita.estado === PENDIENTE) {
                cademResult.pendiente = 1;
            }
        }
        result.push(cademResult);
    }

    return result;
}

function ultimasVisitas(folios: string[], codigoEstudio: number): Promise<Array<{
        id_visita: number,
        fecha: string,
        estado: number,
        folio: number,
    }>> {
    return SUPI.then((conn) => conn.query(`
            WITH folio_visita AS
            (
                SELECT a.ID_VISITA as id_visita
                    , a.HORAINICIO as fecha
                    , a.ESTADO as estado
                    , C.FOLIOCADEM as folio
                    , ROW_NUMBER() OVER (PARTITION BY C.FOLIOCADEM ORDER BY a.ID_VISITA DESC) AS row_num
                FROM VISITA a WITH(NOLOCK)
                INNER JOIN ESTUDIOSALA b WITH(NOLOCK) ON
                    a.ID_ESTUDIOSALA = b.ID_ESTUDIOSALA
                    AND b.ID_ESTUDIO = ${codigoEstudio}
                INNER JOIN SALA c WITH(NOLOCK) ON b.ID_SALA = c.ID_SALA
                WHERE
                    c.FOLIOCADEM IN (${folios})
                    AND a.DIA >= '${moment().subtract(30, "day").format("YYYY-MM-DD")}'
            )
            SELECT
                id_visita
                , fecha
                , estado
                , folio
            FROM folio_visita
            WHERE row_num <= 2
        `));
}

export function tomaVisita(visitaId: number): Promise<IToma[]> {
    return SUPI.then((conn) => conn.query(`
        SELECT CONVERT(int, A.VALOR) as valor
            , b.DESCRIPCION as descripcion
            , b.EAN as ean
            , c.DESCRIPCION as categoria
        FROM TOMA a WITH(NOLOCK)
        INNER JOIN dbo.ITEM b WITH(NOLOCK)
            ON a.ID_PRODUCTO = b.ID_ITEM
        INNER JOIN CODIGOS c WITH(NOLOCK)
            ON b.ID_CATEGORIA = c.ID_CODIGO
        WHERE a.ID_VISITA = ${visitaId}
            AND a.ID_VARIABLE = 1
    `));
}

export function OSA(toma: IToma[]) {
    return toma.reduce((acc, current) => Number(current.valor) ? acc + 1 : acc, 0) / toma.length * 100;
}
