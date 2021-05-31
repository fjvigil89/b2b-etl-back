# Changelog

## [2.0.12] - 2020-08-21
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