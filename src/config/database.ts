import { ConnectionManager, createConnections } from "typeorm";
import { Case, Item, Store, Summary, User } from "../entity";
import { config, DIALECT } from "./config";

export const Connection = createConnections([
  {
    name: "andina",
    database: config.ANDINA_DB.DB,
    entities: [Case, Item, Store, Summary, User],
    host: config.ANDINA_DB.SERVER,
    logging: false,
    password: config.ANDINA_DB.PASSWORD,
    port: config.ANDINA_DB.PORT_DB,
    synchronize: false,
    type: DIALECT,
    username: config.ANDINA_DB.USER_DB,
    connectTimeout: 25000,
  },
  {
    name: "abi",
    database: config.ABI_DB.DB,
    entities: [Case, Item, Store, Summary, User],
    host: config.ABI_DB.SERVER,
    logging: false,
    password: config.ABI_DB.PASSWORD,
    port: config.ABI_DB.PORT_DB,
    synchronize: false,
    type: DIALECT,
    username: config.ABI_DB.USER_DB,
    connectTimeout: 25000,
  },
  {
    name: "cial",
    database: config.CIAL_DB.DB,
    entities: [Case, Item, Store, Summary, User],
    host: config.CIAL_DB.SERVER,
    logging: false,
    password: config.CIAL_DB.PASSWORD,
    port: config.CIAL_DB.PORT_DB,
    synchronize: false,
    type: DIALECT,
    username: config.CIAL_DB.USER_DB,
    connectTimeout: 25000,
  },
  {
    name: "cial_testing",
    database: config.CIAL_TESTING_DB.DB,
    entities: [Case, Item, Store, Summary, User],
    host: config.CIAL_TESTING_DB.SERVER,
    logging: false,
    password: config.CIAL_TESTING_DB.PASSWORD,
    port: config.CIAL_TESTING_DB.PORT_DB,
    synchronize: false,
    type: DIALECT,
    username: config.CIAL_TESTING_DB.USER_DB,
    connectTimeout: 25000,
  },
]);

export const B2B = {
  andina: new ConnectionManager()
    .create({
      database: config.ANDINA_B2B.DB,
      entities: [],
      host: config.ANDINA_B2B.SERVER,
      logging: false,
      password: config.ANDINA_B2B.PASSWORD,
      port: config.ANDINA_B2B.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.ANDINA_B2B.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
  abi: new ConnectionManager()
    .create({
      database: config.ABI_B2B.DB,
      entities: [],
      host: config.ABI_B2B.SERVER,
      logging: false,
      password: config.ABI_B2B.PASSWORD,
      port: config.ABI_B2B.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.ABI_B2B.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
  cial: new ConnectionManager()
    .create({
      database: config.CIAL_B2B.DB,
      entities: [],
      host: config.CIAL_B2B.SERVER,
      logging: false,
      password: config.CIAL_B2B.PASSWORD,
      port: config.CIAL_B2B.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.CIAL_B2B.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
  cial_testing: new ConnectionManager()
    .create({
      database: config.CIAL_TESTING_B2B.DB,
      entities: [],
      host: config.CIAL_TESTING_B2B.SERVER,
      logging: false,
      password: config.CIAL_TESTING_B2B.PASSWORD,
      port: config.CIAL_TESTING_B2B.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.CIAL_TESTING_B2B.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
};

export const SMARTWEB = {
  cial: new ConnectionManager()
    .create({
      database: config.SMARTWEB.CIAL.DB,
      entities: [],
      host: config.SMARTWEB.CIAL.SERVER,
      logging: false,
      password: config.SMARTWEB.CIAL.PASSWORD,
      port: config.SMARTWEB.CIAL.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.SMARTWEB.CIAL.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
  cial_testing: new ConnectionManager()
    .create({
      database: config.SMARTWEB.CIAL.DB,
      entities: [],
      host: config.SMARTWEB.CIAL.SERVER,
      logging: false,
      password: config.SMARTWEB.CIAL.PASSWORD,
      port: config.SMARTWEB.CIAL.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.SMARTWEB.CIAL.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
  andina: new ConnectionManager()
    .create({
      database: config.SMARTWEB.ANDINA.DB,
      entities: [],
      host: config.SMARTWEB.ANDINA.SERVER,
      logging: false,
      password: config.SMARTWEB.ANDINA.PASSWORD,
      port: config.SMARTWEB.ANDINA.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.SMARTWEB.ANDINA.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
  abi: new ConnectionManager()
    .create({
      database: config.SMARTWEB.ABI.DB,
      entities: [],
      host: config.SMARTWEB.ABI.SERVER,
      logging: false,
      password: config.SMARTWEB.ABI.PASSWORD,
      port: config.SMARTWEB.ABI.PORT_DB,
      synchronize: false,
      type: DIALECT,
      username: config.SMARTWEB.ABI.USER_DB,
      connectTimeout: 25000,
    })
    .connect(),
};

export const SUPI = new ConnectionManager()
  .create({
    database: config.SOURCE_SUPI.DB,
    entities: [],
    host: config.SOURCE_SUPI.SERVER,
    logging: false,
    password: config.SOURCE_SUPI.PASSWORD,
    port: config.SOURCE_SUPI.PORT_DB,
    synchronize: false,
    type: "mssql",
    connectionTimeout: 120000,
    requestTimeout: 120000,
    username: config.SOURCE_SUPI.USER_DB,
  })
  .connect();

export const MASTER = new ConnectionManager()
  .create({
    database: config.SOURCE_MASTER.DB,
    entities: [],
    host: config.SOURCE_MASTER.SERVER,
    logging: false,
    password: config.SOURCE_MASTER.PASSWORD,
    port: config.SOURCE_MASTER.PORT_DB,
    synchronize: false,
    type: DIALECT,
    connectTimeout: 60000,
    username: config.SOURCE_MASTER.USER_DB,
  })
  .connect();

export const PRINCIPAL = new ConnectionManager()
  .create({
    database: config.SOURCE_PRINCIPAL.DB,
    entities: [],
    host: config.SOURCE_PRINCIPAL.SERVER,
    logging: false,
    password: config.SOURCE_PRINCIPAL.PASSWORD,
    port: config.SOURCE_PRINCIPAL.PORT_DB,
    synchronize: false,
    type: DIALECT,
    connectTimeout: 60000,
    username: config.SOURCE_PRINCIPAL.USER_DB,
  })
  .connect();
