import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity("store")
export class Store extends BaseEntity {
  @PrimaryColumn("integer")
  public folio: number;

  @Column("varchar", {
    name: "cod_local",
  })
  public codLocal: string;

  @Column("varchar")
  public bandera: string;

  @Column("varchar")
  public cadena: string;

  @Column("varchar")
  public direccion: string;

  @Column("varchar")
  public descripcion: string;

  @Column("varchar", {
    name: "date_b2b",
  })
  public dateB2B: string;

  @Column({
    name: "venta_valor",
    type: "decimal",
    scale: 10,
    precision: 2,
    nullable: true,
  })
  public ventaValor: number;

  @Column("integer", {
    name: "venta_perdida",
  })
  public ventaPerdida: number;

  @Column("integer")
  public mide: number;

  @Column("integer", {
    name: "id_visita",
  })
  public idVisita: number;

  @Column("integer")
  public osa: number;

  @Column("integer")
  public realizada: number;

  @Column("integer")
  public pendiente: number;

  @Column("varchar", {
    name: "fecha_visita",
  })
  public fechaVisita: string;

  @Column("varchar")
  public latitud: any;

  @Column("varchar")
  public longitud: any;
}
