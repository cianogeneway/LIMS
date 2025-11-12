# DNA Extraction WorkList - API Documentation

## Overview

The DNA Extraction WorkList API provides complete CRUD operations for managing automated DNA extraction worklists in 32-format.

**Base URL:** `/api/extraction-worklists`
**Authentication:** NextAuth Session Required
**Content-Type:** `application/json`

---

## Endpoints

### 1. List Worklists (Paginated)

**Request:**
```
GET /api/extraction-worklists?page=1&pageSize=10&q=search_term
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number (1-indexed) |
| pageSize | integer | No | 10 | Items per page (max 100) |
| q | string | No | - | Search query (name, kit lot, performer) |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "e535743b-927a-4056-a19c-377dfecb02f3",
      "name": "DNA Extraction Worklist #1",
      "worklistType": "AUTOMATED_DNA_EXTRACTION_32_FORMAT",
      "status": "DRAFT",
      "date": "2024-12-15T10:30:00Z",
      "performedBy": "John Technician",
      "extractionKitLot": "KIT-2024-001",
      "createdAt": "2024-12-15T10:30:00Z",
      "updatedAt": "2024-12-15T10:30:00Z",
      "createdBy": "john@example.com"
    }
  ],
  "total": 42
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not logged in)
- `500` - Server error

---

### 2. Create Worklist

**Request:**
```
POST /api/extraction-worklists
Content-Type: application/json

{
  "name": "DNA Extraction Worklist",
  "performedBy": "Jane Technician",
  "extractionKitLot": "KIT-2024-001",
  "date": "2024-12-15T10:30:00Z",
  "qubitMixX1": 1,
  "qubitMixXn4": 4,
  "qubitReagent": 1,
  "qubitBuffer": 199,
  "kitLot": "KL-2024-001",
  "kitExpiryDate": "2025-12-31",
  "aliquoteInfo": "Aliquote 198ul and 2ul DNA",
  "standardsInfo": "Standards 190ul, 10ul Standard"
}
```

**Request Body (all fields optional):**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| name | string | "Automated DNA Extraction 32 Format" | Worklist name |
| performedBy | string | null | Technician name |
| extractionKitLot | string | null | Extraction kit lot reference |
| date | ISO 8601 | Current timestamp | Extraction date |
| qubitMixX1 | integer | 1 | Qubit mix volume (µL) |
| qubitMixXn4 | integer | null | Qubit mix Xn+4 volume |
| qubitReagent | integer | 1 | Qubit reagent volume |
| qubitBuffer | integer | 199 | Qubit buffer volume |
| kitLot | string | null | Kit lot number |
| kitExpiryDate | date | null | Kit expiry date |
| aliquoteInfo | string | "Aliquote 198ul and 2ul DNA" | Aliquote instructions |
| standardsInfo | string | "Standards 190ul, 10ul Standard" | Standards setup info |

**Response (200 OK):**
```json
{
  "id": "e535743b-927a-4056-a19c-377dfecb02f3",
  "name": "DNA Extraction Worklist",
  "worklistType": "AUTOMATED_DNA_EXTRACTION_32_FORMAT",
  "status": "DRAFT",
  "date": "2024-12-15T10:30:00Z",
  "performedBy": "Jane Technician",
  "extractionKitLot": "KIT-2024-001",
  "createdAt": "2024-12-15T10:30:00Z",
  "updatedAt": "2024-12-15T10:30:00Z",
  "createdBy": "jane@example.com"
}
```

**Notes:**
- Automatically creates 32 empty sample rows
- User email auto-populated from session

**Status Codes:**
- `200` - Created successfully
- `401` - Unauthorized
- `500` - Server error

---

### 3. Get Worklist Detail

**Request:**
```
GET /api/extraction-worklists/{id}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Worklist ID |

**Response (200 OK):**
```json
{
  "id": "e535743b-927a-4056-a19c-377dfecb02f3",
  "name": "DNA Extraction Worklist",
  "worklistType": "AUTOMATED_DNA_EXTRACTION_32_FORMAT",
  "status": "DRAFT",
  "date": "2024-12-15T10:30:00Z",
  "performedBy": "Jane Technician",
  "extractionKitLot": "KIT-2024-001",
  "qubitMixX1": 1,
  "qubitMixXn4": 4,
  "qubitReagent": 1,
  "qubitBuffer": 199,
  "kitLot": "KL-2024-001",
  "kitExpiryDate": "2025-12-31T00:00:00Z",
  "aliquoteInfo": "Aliquote 198ul and 2ul DNA",
  "standardsInfo": "Standards 190ul, 10ul Standard",
  "createdAt": "2024-12-15T10:30:00Z",
  "updatedAt": "2024-12-15T10:30:00Z",
  "createdBy": "jane@example.com",
  "rows": [
    {
      "id": "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5g6h7",
      "well": 1,
      "sampleId": "SAMPLE001",
      "sampleName": "Patient Sample 001",
      "sex": "M",
      "sampleType": "BLOOD",
      "comment": "Good quality",
      "testRequested": "WGS",
      "nanoDropNgUl": 150.5,
      "a260_230": 1.8,
      "a260_280": 1.7,
      "gel": "INTACT",
      "qubitNgUl": 148.2,
      "dilutionFactor": 1.0,
      "gelDilution": null,
      "dH20Volume": null,
      "loadingDyeBuffer": null,
      "createdAt": "2024-12-15T10:30:00Z",
      "updatedAt": "2024-12-15T10:30:00Z"
    },
    // ... 31 more rows (wells 2-32)
  ],
  "qcResults": [
    {
      "id": "qc1-uuid",
      "sampleId": "SAMPLE001",
      "extractionType": "DNA_EXTRACTION",
      "qcMethod": "NANODROP",
      "concentration": 150.5,
      "ratio260_280": 1.7,
      "ratio260_230": 1.8,
      "gelResult": "INTACT",
      "qubitConcentration": 148.2,
      "passed": true,
      "override": false,
      "createdAt": "2024-12-15T10:30:00Z",
      "updatedAt": "2024-12-15T10:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Worklist not found
- `500` - Server error

---

### 4. Update Worklist

**Request:**
```
PUT /api/extraction-worklists/{id}
Content-Type: application/json

{
  "header": {
    "name": "Updated Worklist Name",
    "status": "IN_PROGRESS",
    "date": "2024-12-15T10:30:00Z",
    "performedBy": "Jane Technician",
    "extractionKitLot": "KIT-2024-001",
    "qubitMixX1": 1,
    "qubitMixXn4": 4,
    "qubitReagent": 1,
    "qubitBuffer": 199,
    "kitLot": "KL-2024-001",
    "kitExpiryDate": "2025-12-31",
    "aliquoteInfo": "Updated aliquote info",
    "standardsInfo": "Updated standards info"
  },
  "rows": [
    {
      "id": "row-uuid-1",
      "sampleId": "SAMPLE001",
      "sampleName": "Patient Sample 001",
      "sex": "M",
      "sampleType": "BLOOD",
      "comment": "Good quality",
      "testRequested": "WGS",
      "nanoDropNgUl": 150.5,
      "a260_230": 1.8,
      "a260_280": 1.7,
      "gel": "INTACT",
      "qubitNgUl": 148.2,
      "dilutionFactor": 1.0,
      "gelDilution": null,
      "dH20Volume": null,
      "loadingDyeBuffer": null
    }
    // ... more rows to update
  ]
}
```

**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| header | object | Optional - header fields to update |
| rows | array | Optional - row objects to update (only specified rows updated) |

**Response (200 OK):**
```json
{
  "success": true,
  "updatedAt": "2024-12-15T11:45:00Z"
}
```

**Status Codes:**
- `200` - Updated successfully
- `401` - Unauthorized
- `404` - Worklist not found
- `500` - Server error

---

### 5. Delete Worklist

**Request:**
```
DELETE /api/extraction-worklists/{id}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Worklist ID |

**Response (200 OK):**
```json
{
  "success": true
}
```

**Notes:**
- Cascading delete removes all associated:
  - ExtractionWorklistRows (32 wells)
  - ExtractionQCResults (all QC records)

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `404` - Worklist not found
- `500` - Server error

---

## Data Types & Validation

### Worklist Status Enum
```
DRAFT
IN_PROGRESS
COMPLETED
```

### Worklist Type Enum
```
AUTOMATED_DNA_EXTRACTION_32_FORMAT
```

### Sample Fields
| Field | Type | Valid Values | Notes |
|-------|------|--------------|-------|
| sex | string | M, F, Unknown, etc. | Free text |
| sampleType | string | BLOOD, SALIVA, TISSUE, etc. | Free text |
| gel | string | INTACT, DEGRADED, etc. | Free text |
| testRequested | string | WGS, WES, RNA, etc. | Free text |

### Numeric Fields
| Field | Type | Range | Unit |
|-------|------|-------|------|
| nanoDropNgUl | decimal | 0-9999.99 | ng/µL |
| a260_230 | decimal | 0-9999.99 | Ratio |
| a260_280 | decimal | 0-9999.99 | Ratio |
| qubitNgUl | decimal | 0-9999.99 | ng/µL |
| dilutionFactor | decimal | 0-9999.99 | Factor |
| qubitMixX1 | integer | 0-999 | µL |
| qubitMixXn4 | integer | 0-999 | µL |
| qubitReagent | integer | 0-999 | µL |
| qubitBuffer | integer | 0-999 | µL |

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** User not logged in or session expired

### 404 Not Found
```json
{
  "error": "Worklist not found"
}
```
**Cause:** Worklist ID doesn't exist

### 500 Server Error
```json
{
  "error": "Failed to fetch worklist"
}
```
**Cause:** Database error or server issue
**Action:** Check server logs, retry request

---

## Example Usage

### Create and Populate Worklist (Node.js)

```javascript
// 1. Create worklist
const createRes = await fetch('/api/extraction-worklists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Project XYZ DNA Extraction',
    performedBy: 'John Smith',
    date: new Date(),
    kitLot: 'KIT-2024-001'
  })
})

const worklist = await createRes.json()
const worklistId = worklist.id

// 2. Get worklist with 32 empty rows
const detailRes = await fetch(`/api/extraction-worklists/${worklistId}`)
const detail = await detailRes.json()

// 3. Update rows with sample data
const updateRes = await fetch(`/api/extraction-worklists/${worklistId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rows: detail.rows.map((row, idx) => ({
      ...row,
      sampleId: `SAMPLE${String(idx + 1).padStart(3, '0')}`,
      sampleName: `Patient ${idx + 1}`,
      sampleType: 'BLOOD',
      nanoDropNgUl: 150 + Math.random() * 50
    }))
  })
})

console.log('Worklist updated:', await updateRes.json())
```

### Search Worklists (cURL)

```bash
curl -X GET \
  'http://localhost:3000/api/extraction-worklists?page=1&pageSize=10&q=Project%20XYZ' \
  -H 'Cookie: next-auth.session-token=your_token'
```

---

## Rate Limiting

No explicit rate limiting implemented. Recommended limits:
- Max 100 requests per minute per user
- Max 1000 requests per minute per IP

---

## CORS

API endpoints are same-origin only (no CORS headers). For cross-origin requests, use appropriate CORS middleware.

---

## Authentication

All endpoints require NextAuth session:
- Login required at `/login`
- Session cookie: `next-auth.session-token`
- Expires: 30 days (configurable)

---

## Changelog

### Version 1.0 (December 2024)
- Initial implementation
- 5 endpoints: List, Create, Get, Update, Delete
- Pagination and search support
- 32-sample well support
- QC results tracking

---

## Support & Issues

For API issues or bugs:
1. Check response status code
2. Review error message
3. Check request body syntax
4. Verify authentication
5. Check database connectivity
6. Review server logs

---

**Last Updated:** December 2024
**API Version:** 1.0
**Status:** Production Ready
