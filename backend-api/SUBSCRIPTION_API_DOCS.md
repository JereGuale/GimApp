# API de Suscripciones - Documentación

## Endpoints Implementados

### 🧑 Usuario - Gestión de Suscripciones

#### 1. Obtener mi suscripción actual
```http
GET /api/subscription/my
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "id": 1,
  "user_id": 5,
  "subscription_plan_id": 2,
  "status": "active",
  "payment_method": "card",
  "payment_receipt": null,
  "approved_by": null,
  "approved_at": "2026-02-07T00:00:00.000000Z",
  "rejection_reason": null,
  "starts_at": "2026-02-07T00:00:00.000000Z",
  "ends_at": "2026-03-07T00:00:00.000000Z",
  "price": "24.99",
  "plan": {
    "id": 2,
    "name": "Plan Pro",
    "price": "24.99",
    "duration": 1,
    "features": ["Acceso total", "Rutinas avanzadas"]
  }
}
```

#### 2. Crear suscripción con TARJETA
```http
POST /api/subscription/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription_plan_id": 2,
  "payment_method": "card",
  "card_number": "4111111111111111",
  "card_name": "Juan Pérez",
  "card_expiry": "12/25",
  "card_cvv": "123"
}
```

**Respuesta:**
```json
{
  "message": "Suscripción activada exitosamente",
  "subscription": {
    "id": 1,
    "status": "active",
    "payment_method": "card",
    "starts_at": "2026-02-07T00:00:00.000000Z",
    "ends_at": "2026-03-07T00:00:00.000000Z",
    "plan": { ... }
  }
}
```

#### 3. Crear suscripción con TRANSFERENCIA
```http
POST /api/subscription/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "subscription_plan_id": 2,
  "payment_method": "transfer"
}
```

**Respuesta:**
```json
{
  "message": "Suscripción creada. Suba su comprobante para activarla",
  "subscription": {
    "id": 2,
    "status": "pending",
    "payment_method": "transfer",
    "plan": { ... }
  }
}
```

#### 4. Subir comprobante de pago
```http
POST /api/subscription/{id}/upload-receipt
Authorization: Bearer {token}
Content-Type: multipart/form-data

receipt: [archivo imagen]
```

**Respuesta:**
```json
{
  "message": "Comprobante subido exitosamente. Esperando aprobación",
  "subscription": {
    "id": 2,
    "status": "pending",
    "payment_receipt": "receipts/abc123.jpg",
    "plan": { ... }
  }
}
```

---

### 🏋️ Trainer - Gestión de Aprobaciones

#### 1. Obtener todas las suscripciones (con filtros)
```http
GET /api/trainer/subscriptions
Authorization: Bearer {trainer_token}

# Filtros opcionales:
# ?status=pending
# ?plan_id=2
# ?search=juan
```

**Respuesta:**
```json
[
  {
    "id": 2,
    "user_id": 5,
    "subscription_plan_id": 2,
    "status": "pending",
    "payment_method": "transfer",
    "payment_receipt": "receipts/abc123.jpg",
    "approved_by": null,
    "approved_at": null,
    "rejection_reason": null,
    "price": "24.99",
    "user": {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "plan": {
      "id": 2,
      "name": "Plan Pro",
      "price": "24.99"
    }
  }
]
```

#### 2. Obtener contador de pendientes
```http
GET /api/trainer/subscriptions/pending-count
Authorization: Bearer {trainer_token}
```

**Respuesta:**
```json
{
  "count": 5
}
```

#### 3. Aprobar suscripción
```http
POST /api/trainer/subscriptions/{id}/approve
Authorization: Bearer {trainer_token}
```

**Respuesta:**
```json
{
  "message": "Suscripción aprobada exitosamente",
  "subscription": {
    "id": 2,
    "status": "active",
    "approved_by": 3,
    "approved_at": "2026-02-07T01:00:00.000000Z",
    "starts_at": "2026-02-07T01:00:00.000000Z",
    "ends_at": "2026-03-07T01:00:00.000000Z",
    "user": { ... },
    "plan": { ... }
  }
}
```

#### 4. Rechazar suscripción
```http
POST /api/trainer/subscriptions/{id}/reject
Authorization: Bearer {trainer_token}
Content-Type: application/json

{
  "reason": "Comprobante ilegible"
}
```

**Respuesta:**
```json
{
  "message": "Suscripción rechazada",
  "subscription": {
    "id": 2,
    "status": "rejected",
    "rejection_reason": "Comprobante ilegible",
    "user": { ... },
    "plan": { ... }
  }
}
```

---

## Estados de Suscripción

- **`pending`**: Esperando aprobación (transferencias)
- **`active`**: Aprobada y activa
- **`rejected`**: Rechazada por trainer
- **`expired`**: Expirada (fecha de fin pasada)
- **`cancelled`**: Cancelada

---

## Métodos de Pago

- **`card`**: Tarjeta de crédito (aprobación automática simulada)
- **`transfer`**: Transferencia bancaria (requiere aprobación manual)

---

## Acceso a Comprobantes

Los comprobantes se guardan en `storage/app/public/receipts/`

URL de acceso: `http://localhost:8000/storage/receipts/{filename}`

Ejemplo: `http://localhost:8000/storage/receipts/abc123.jpg`

---

## Validaciones

### Crear suscripción
- `subscription_plan_id`: Requerido, debe existir
- `payment_method`: Requerido (`card` o `transfer`)
- Si `card`:
  - `card_number`: Requerido
  - `card_name`: Requerido
  - `card_expiry`: Requerido
  - `card_cvv`: Requerido

### Subir comprobante
- `receipt`: Requerido, debe ser imagen, máximo 5MB
- Solo para suscripciones con `payment_method=transfer`
- Solo el dueño puede subir

### Aprobar/Rechazar
- Solo suscripciones con `status=pending`
- Solo trainers/admins pueden acceder
- Reason (opcional) en rechazo

---

## Errores Comunes

### 403 Forbidden
```json
{
  "message": "No autorizado"
}
```
- Usuario intentando acceder a suscripción de otro usuario
- Usuario sin rol trainer intentando aprobar

### 400 Bad Request
```json
{
  "message": "Solo se pueden aprobar suscripciones pendientes"
}
```
- Intentando aprobar suscripción que ya está activa/rechazada

### 422 Unprocessable Entity
```json
{
  "errors": {
    "card_number": ["The card number field is required when payment method is card."]
  }
}
```
- Validación fallida

---

## Ejemplos de Uso con cURL

### Usuario suscribe con tarjeta
```bash
curl -X POST http://localhost:8000/api/subscription/subscribe \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_plan_id": 2,
    "payment_method": "card",
    "card_number": "4111111111111111",
    "card_name": "Juan Pérez",
    "card_expiry": "12/25",
    "card_cvv": "123"
  }'
```

### Usuario suscribe con transferencia
```bash
curl -X POST http://localhost:8000/api/subscription/subscribe \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_plan_id": 2,
    "payment_method": "transfer"
  }'
```

### Subir comprobante
```bash
curl -X POST http://localhost:8000/api/subscription/2/upload-receipt \
  -H "Authorization: Bearer {token}" \
  -F "receipt=@/path/to/receipt.jpg"
```

### Trainer aprueba
```bash
curl -X POST http://localhost:8000/api/trainer/subscriptions/2/approve \
  -H "Authorization: Bearer {trainer_token}"
```

### Trainer rechaza
```bash
curl -X POST http://localhost:8000/api/trainer/subscriptions/2/reject \
  -H "Authorization: Bearer {trainer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Comprobante no válido"
  }'
```

---

## Testing en Postman/Thunder Client

1. **Obtener token de usuario:**
   - POST `/api/login` con email y password
   - Guardar el `access_token`

2. **Crear suscripción:**
   - POST `/api/subscription/subscribe`
   - Headers: `Authorization: Bearer {token}`

3. **Ver suscripción:**
   - GET `/api/subscription/my`

4. **Trainer: Ver pendientes:**
   - Loginear como trainer
   - GET `/api/trainer/subscriptions?status=pending`

5. **Aprobar:**
   - POST `/api/trainer/subscriptions/{id}/approve`
