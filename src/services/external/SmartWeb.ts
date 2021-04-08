import { SMARTWEB } from "../../config/database";

export async function ultimoQuiereCademSmart(
  client: string,
  folio: string
): Promise<any> {
  return SMARTWEB[client].then((conn) =>
    conn.query(`
    SELECT 
        t.ean as EAN,
        v.FECHA as UQC                
    FROM TBL_VISITAS v
    INNER JOIN TBL_TOMA_OSA t ON v.ID_VISITA_SUPI = t.ID_VISITA_SUPI
    INNER JOIN store_master sm ON sm.s_idsalasupi = v.ID_SALA                
    WHERE sm.s_folio_cadem = "${folio}"
        AND v.estado = 4
        AND t.respuesta = 0
        AND t.ID_VARIABLE = 1
    ORDER BY v.FECHA DESC`)
  );
}

export async function quiebreConsecutivo(
  client: string,
  visita: string
): Promise<any> {
  return SMARTWEB[client].then((conn) =>
    conn.query(`
      SELECT
        EAN,
        QUIEBRE_CONSECUTIVO
      FROM TBL_CAUSAS_QUIEBRE
      WHERE ID_VISITA = "${visita}"`)
  );
}
