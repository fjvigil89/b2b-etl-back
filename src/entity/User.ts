import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity("user")
export class User extends BaseEntity {

    @PrimaryColumn("varchar")
    public id: string;

    @Column("varchar")
    public name: string;

    @Column("varchar")
    public password: string;

    @Column("varchar")
    public email: string;

    @Column("varchar")
    public notification: string;

}
