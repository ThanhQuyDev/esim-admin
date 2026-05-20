# Skill: Integrate API Filter Search (Frontend)

## Description
Hướng dẫn Frontend integrate chức năng filter/search cho các endpoint CMS đã có sẵn ở Backend.

## API Filter Search Endpoints

### 1. Modules sử dụng query param `search` trực tiếp

Các module sau nhận `search` như một query parameter riêng biệt:

| Module | Endpoint | Search Param | Tìm kiếm theo |
|--------|----------|--------------|----------------|
| Blogs | `GET /api/v1/blogs` | `?search=keyword` | title |
| Help Center | `GET /api/v1/help-center` | `?search=keyword` | title |
| Why Choose Us | `GET /api/v1/why-choose-us` | `?search=keyword` | title, description |
| Footers | `GET /api/v1/footers` | `?search=keyword` | title, titleVi |
| Hero Banners | `GET /api/v1/hero-banners` | `?search=keyword` | title, description |

**Ví dụ request:**
```
GET /api/v1/blogs?page=1&limit=10&search=esim
GET /api/v1/help-center?page=1&limit=10&search=cài đặt&category=GETTING_STARTED
GET /api/v1/footers?page=1&limit=10&search=liên hệ
GET /api/v1/hero-banners?page=1&limit=10&search=travel
GET /api/v1/why-choose-us?page=1&limit=10&search=bảo mật
```

### 2. Modules sử dụng `filters` JSON (infinity-pagination pattern)

Các module sau nhận `search` bên trong object `filters` (JSON string):

| Module | Endpoint | Filter Format | Tìm kiếm theo |
|--------|----------|---------------|----------------|
| Destinations | `GET /api/v1/destinations` | `filters={"search":"keyword"}` | name, keySearch |
| eSIMs | `GET /api/v1/esims` | `filters={"search":"keyword"}` | iccid, esimTranNo |
| Order Items | `GET /api/v1/order-items` | `filters={"search":"keyword"}` | orderRequestId |

**Ví dụ request:**
```
GET /api/v1/destinations?page=1&limit=10&filters={"search":"japan","isActive":true}
GET /api/v1/esims?page=1&limit=10&filters={"search":"8901234","status":"available"}
GET /api/v1/order-items?page=1&limit=10&filters={"search":"ORD-123","orderId":5}
```

### 3. Modules đã có filter từ trước (không cần thêm)

| Module | Endpoint | Đã có search |
|--------|----------|--------------|
| Destinations | `GET /api/v1/destinations` | ✅ `filters={"search":"..."}` |
| Regions | `GET /api/v1/regions` | ✅ `filters={"search":"..."}` |
| Plans (eSIM Plan) | `GET /api/v1/plans` | ✅ `filters={"search":"..."}` |

---

## Hướng dẫn Integrate ở Frontend

### Pattern 1: Query param `search` (Blogs, Help Center, Why Choose Us, Footers, Hero Banners)

```typescript
// services/api.ts
export async function fetchBlogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);

  const res = await fetch(`/api/v1/blogs?${query.toString()}`);
  return res.json();
}
```

### Pattern 2: JSON `filters` param (Destinations, eSIMs, Order Items)

```typescript
// services/api.ts
interface EsimFilters {
  search?: string;
  status?: string;
  userId?: number;
}

export async function fetchEsims(params: {
  page?: number;
  limit?: number;
  filters?: EsimFilters;
  sort?: Array<{ orderBy: string; order: 'ASC' | 'DESC' }>;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.filters) query.set('filters', JSON.stringify(params.filters));
  if (params.sort) query.set('sort', JSON.stringify(params.sort));

  const res = await fetch(`/api/v1/esims?${query.toString()}`);
  return res.json();
}
```

### Debounce Search Input

Luôn debounce input search để tránh gọi API quá nhiều:

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

function SearchInput({ onSearch }: { onSearch: (value: string) => void }) {
  const debouncedSearch = useMemo(
    () => debounce((value: string) => onSearch(value), 300),
    [onSearch],
  );

  return (
    <input
      type="text"
      placeholder="Tìm kiếm..."
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
}
```

### Response Format

Tất cả endpoint trả về format infinity-pagination:

```json
{
  "data": [...],
  "hasNextPage": true,
  "totalCount": 42
}
```

---

## Lưu ý

- Search sử dụng `ILIKE` (case-insensitive, partial match) ở backend
- Truyền empty string hoặc không truyền param `search` sẽ bỏ qua filter search
- Có thể kết hợp search với các filter khác (category, status, isActive...)
- Pagination vẫn hoạt động bình thường khi có search
- `totalCount` trong response phản ánh số lượng sau khi đã filter
