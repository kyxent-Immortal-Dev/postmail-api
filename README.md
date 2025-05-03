# POSTMAIL API

API para gestionar envíos de POSTMAIL.

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
MONGO=mongodb://localhost:27017/postmail
PORT=3000
```

2. Instala las dependencias:
```
npm install
```

3. Inicia el servidor:
```
npm run dev
```

El servidor se iniciará, conectará a MongoDB y verificará si existen datos iniciales. Si no existen usuarios, creará un usuario de prueba automáticamente.

## Endpoints

### Gestión de créditos

#### Verificar créditos disponibles

-- En la terminal saldrá el id del usuario creado automaticamente

```
GET /api/users/:userId/credits
```

Ejemplo de respuesta:
```json
{
  "message": "Información de crédito",
  "data": {
    "credits": 135,
    "shipments": 30,
    "cost": 4.5
  }
}
```

#### Comprar créditos
```
POST /api/users/:userId/credits
```

Cuerpo de la solicitud:
```json
{
  "plan": 1
}
```

Planes disponibles:
- Plan 1: $135 por 30 envíos
- Plan 2: $160 por 40 envíos
- Plan 3: $180 por 60 envíos

### Gestión de envíos

#### Crear un nuevo envío
```
POST /api/users/:userId/shipments
```

Cuerpo de la solicitud:
```json
{
  "name": "Nombre del destinatario",
  "address": "Dirección del destinatario",
  "phone": "Teléfono del destinatario",
  "ref": "Referencia",
  "observation": "Observaciones"
}
```

#### Obtener todos los envíos de un usuario
```
GET /api/users/:userId/shipments
```

#### Obtener un envío específico
```
GET /api/shipments/:shipmentId
```

#### Eliminar un envío
```
DELETE /api/shipments/:shipmentId
```

Al eliminar un envío, el crédito se devuelve automáticamente al usuario.

### Gestión de productos

#### Agregar producto a un envío
```
POST /api/shipments/:shipmentId/products
```

Cuerpo de la solicitud:
```json
{
  "description": "Descripción del producto",
  "weight": 2.5,
  "packages": 1,
  "delivery_date": "2025-05-10"
}
```

Notas sobre el peso:
- Si el peso supera las 3 libras, se cobra el doble.
- Si el peso supera las 6 libras, se cobra el triple.

#### Obtener productos de un envío
```
GET /api/shipments/:shipmentId/products
```

#### Actualizar un producto
```
PUT /api/products/:productId
```

Cuerpo de la solicitud:
```json
{
  "description": "Nueva descripción",
  "weight": 3.5,
  "packages": 2,
  "delivery_date": "2025-05-15"
}
```

#### Eliminar un producto
```
DELETE /api/products/:productId
```

## Notas técnicas

- El proyecto utiliza los 4 pilares fundamentales de POO:
  - **Encapsulación**: Datos protegidos con atributos privados
  - **Herencia**: Clases concretas que extienden de clases abstractas
  - **Abstracción**: Interfaces bien definidas
  - **Polimorfismo**: Métodos con comportamientos específicos según contexto

- La API está construida con:
  - Express.js para el manejo de rutas
  - MongoDB/Mongoose para la persistencia de datos
  - Clases abstractas para modelar los objetos del dominio
  - Controladores específicos para cada entidad

