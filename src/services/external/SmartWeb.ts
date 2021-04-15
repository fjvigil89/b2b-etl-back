import { SMARTWEB } from "../../config/database";

export async function ultimoQuiereCademSmartYquiebreConsecutivo(
  client: string,
  folio: string
): Promise<any> {
  return SMARTWEB[client].then((conn) =>
    conn.query(`
    SELECT
      t.ean as EAN,
      v.FECHA as UQC, 
      t.QUIEBRE_CONSECUTIVO as QUIEBRE_CONSECUTIVO
    FROM TBL_VISITAS v
    INNER JOIN TBL_CAUSAS_QUIEBRE t ON v.ID_VISITA_SUPI = t.ID_VISITA
    INNER JOIN store_master sm ON sm.s_idsalasupi = v.ID_SALA
    WHERE sm.s_folio_cadem = "${folio}"
      AND v.estado = 4
    ORDER BY v.FECHA DESC`)
  );
}
