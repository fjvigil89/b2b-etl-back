# Changelog

## [2.1.3] - 2022-03-08
## Fix
- Se cambia el punto de acceso a la base de datos de SUPI debido a la migración de esta.

## [2.1.2] - 2021-12-29
## Fix
- Se corrige error en el chunk cambiando una funcion propia reemplazandola por chunk de LoDash. 


## [2.1.1] - 2021-10-15
## feature
- Se arregla calculo de la venta valor.

## [2.1.0] - 2021-10-07
## feature
- Se agrega calculo para obtener la suma de la venta valor del ultimo dia disponible de cada sala.

## [2.0.15] - 2021-06-08

## Fix

- Cambio de Reponer por Revisión

## [2.0.14] - 2021-06-01

## Fix

- Corrección de la forma en que se ejecutan los cron x cliente

## [2.0.13] - 2021-05-31

## Fix

- Corrección de puerto en archivo .env
- Cambio de horario en los cron x cliente.
- se añaden logs para ver mejor lo que se está ejecutando.
- Se arregla fecha en CHANGELOG de la versión 2.0.12

## [2.0.12] - 2021-05-31

## Fix

- Corrección casteo stock a number en Item y Store
- Corrección de casteo stock cuando stock es nulo o nan.
- Definición de versión en package.json

## [2.0.6] - 2020-08-21

- Update node version in gitlab-ci

## [2.0.5] - 2020-08-21

- Ahora el proceso para determinar si un item es caso, se realiza cruzando la tabla "casos" y no usando la bandera "caso" de la
  tabla movimiento

## [2.0.4] - 2020-07-08

### Bugfix

- Antes de enviar las notificaciones el servicio `src/services/Notification.ts` se asegura de no tener tokens duplicados.
- El servicio `src/scheduler/Store.ts` envia notificaciones solo cuando las ventas estan procesadas y el campo `notificacion_app` sea menor a la fecha de hoy o que `notificacion_app` sea nulo.
