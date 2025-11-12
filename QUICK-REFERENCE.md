# Quick Reference: Pagination & Search

## How to Test Each Page

### 1. Clients Page (`/clients`)
```
Search for: "acme" or "john@example.com"
Pagination: Click numbered buttons to navigate
Expected: Shows 10 clients per page, filters in real-time
```

### 2. Suppliers Page (`/suppliers`)
```
Search for: "supplier name" or email
Pagination: Click prev/next buttons
Expected: 10 suppliers per page, search filters immediately
```

### 3. Stock Page (`/stock`)
```
Search for: "reagent name" or "stock code"
Pagination: Navigate pages while maintaining search
Expected: 10 stock items per page, counts update
```

### 4. Samples Page (`/samples`)
```
Search for: "S001" (sample ID) or client name
Pagination: Page through samples
Expected: 10 samples per page, real-time filtering
```

### 5. Users Page (`/users`)
```
Search for: email, name, or role (e.g., "admin")
Pagination: Click pagination controls
Expected: 10 users per page, instant search results
```

---

## API Endpoints

All endpoints support these query parameters:

| Parameter | Type | Example | Default |
|-----------|------|---------|---------|
| `page` | number | `?page=2` | 1 |
| `pageSize` | number | `?pageSize=10` | 10 |
| `q` | string | `?q=search+term` | "" (empty) |

### Example Requests
```
GET /api/clients?page=1&pageSize=10
GET /api/clients?page=2&pageSize=10&q=acme
GET /api/suppliers?q=john
GET /api/stock?page=1&pageSize=10&q=reagent
GET /api/samples?q=S001&page=1
GET /api/users?q=admin
```

### Example Response
```json
{
  "data": [
    { "id": "...", "name": "..." },
    { "id": "...", "name": "..." }
  ],
  "total": 42
}
```

---

## Component Usage in Other Pages

To add pagination + search to a new page:

### 1. Update API Route
```typescript
// app/api/endpoint/route.ts
export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(url.searchParams.get('pageSize') || '10'))
  const q = url.searchParams.get('q') || ''
  const offset = (page - 1) * pageSize

  // Build WHERE clause for search
  // ... existing query logic ...
  
  // Add pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(pageSize, offset)
  
  return NextResponse.json({ data: items, total })
}
```

### 2. Update Page Component
```typescript
import { Pagination } from '@/components/ui/pagination'
import { Search } from 'lucide-react'

const [items, setItems] = useState<any[]>([])
const [total, setTotal] = useState(0)
const [page, setPage] = useState(1)
const [searchQuery, setSearchQuery] = useState('')

const fetchItems = async (pageNum: number, search: string) => {
  const params = new URLSearchParams()
  params.set('page', String(pageNum))
  params.set('pageSize', '10')
  if (search) params.set('q', search)
  
  const res = await fetch(`/api/endpoint?${params.toString()}`)
  const data = await res.json()
  setItems(data.data || [])
  setTotal(data.total || 0)
  setPage(pageNum)
}

useEffect(() => {
  fetchItems(1, searchQuery)
}, [searchQuery])

// In JSX:
<div className="flex gap-2">
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
    <Input
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
    />
  </div>
</div>

{total > 10 && (
  <Pagination
    page={page}
    pageSize={10}
    total={total}
    onPageChange={(newPage) => fetchItems(newPage, searchQuery)}
  />
)}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Search not triggering | Check `useEffect` dependency includes `searchQuery` |
| Pagination not working | Ensure API returns `{ data, total }` format |
| Page resets unexpectedly | Verify fetch calls pass `searchQuery` parameter |
| Search too slow | Add debounce to search input (optional enhancement) |
| Results not filtering | Check `ILIKE` operator is used in WHERE clause |

---

## Files Reference

### Core Files
- `components/ui/pagination.tsx` — Reusable pagination component
- `lib/db.ts` — Database pool connection

### API Routes Modified
- `app/api/clients/route.ts`
- `app/api/suppliers/route.ts`
- `app/api/stock/route.ts`
- `app/api/samples/route.ts`
- `app/api/users/route.ts`

### UI Pages Modified
- `app/clients/page.tsx`
- `app/suppliers/page.tsx`
- `app/stock/page.tsx`
- `app/samples/page.tsx`
- `app/users/page.tsx`

---

## Keyboard Shortcuts (Future)
Currently not implemented, but could be added:
- `Page Down` → Next page
- `Page Up` → Previous page
- `Ctrl+F` → Focus search
- `Escape` → Clear search

---

**Questions?** Check `PAGINATION-SEARCH-SUMMARY.md` or `IMPLEMENTATION-COMPLETE.md` for detailed docs.
