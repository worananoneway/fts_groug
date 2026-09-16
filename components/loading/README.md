# ระบบ Loading ของโปรเจค

ทุกจุดที่ต้องบอกว่า "กำลังโหลด" ใช้ของในโฟลเดอร์นี้เท่านั้น ห้ามเขียนสปินเนอร์/ข้อความโหลดเองในหน้า
เพื่อให้หน้าตาและชื่อ state เหมือนกันหมด — **ชื่อ state ใช้ `isLoading` ทุกที่**

```
components/loading/
├── main.tsx            สปินเนอร์ + PageLoading + LoadingBlock + LoadingOverlay + LoadingGate + InlineLoading
├── skeleton.tsx        โครงจำลองตาราง / การ์ด / ข้อความ
├── use-loading.ts      hook useLoading() สำหรับงาน async ในหน้า
├── route-transition.tsx  หน้าโหลดตอนเปลี่ยนหน้า (ครอบไว้ที่ app/layout.tsx แล้ว)
└── index.ts            ทางเข้าเดียว: import { ... } from "@/components/loading"
```

## 1. เปลี่ยนหน้า (route transition) — ทำให้แล้ว ไม่ต้องแตะ

`app/layout.tsx` ครอบ `<RouteTransitionProvider>` ไว้แล้ว จึงมีหน้าโหลดคั่น **ทุกครั้ง** ที่เปลี่ยนหน้า

- คลิก `<Link>` / `<a>` ภายในเว็บ → ดักให้อัตโนมัติ ไม่ต้องแก้ที่ลิงก์
- ปุ่ม back / forward ของเบราว์เซอร์ → ดักให้อัตโนมัติ
- เปลี่ยนหน้าด้วยโค้ด → **ใช้ `useNavigate()` แทน `useRouter()`**

```tsx
const router = useNavigate();
router.push("/po");                       // ขึ้นหน้าโหลดให้เอง
router.push("/cutting", "กำลังเปิดงานตัด..."); // ใส่ข้อความเองก็ได้
router.silentReplace("/cutting");         // แค่ล้าง query ของหน้าเดิม ไม่ต้องขึ้นหน้าโหลด
```

## 2. หน้าใหม่ทุกหน้า ต้องมี `loading.tsx`

วางไฟล์ `loading.tsx` ไว้ข้าง `page.tsx` — หนึ่งบรรทัดจบ

```tsx
// app/(division)/po/loading.tsx
import { createPageLoading } from "@/components/loading/main";

export default createPageLoading("กำลังโหลดใบสั่งซื้อ...");
```

## 3. โหลดข้อมูลในหน้า

```tsx
import { LoadingGate, SkeletonTable, useLoading } from "@/components/loading";

const { isLoading, run } = useLoading(true);
useEffect(() => { void run(loadRows); }, [run]);

// ยังไม่มีข้อมูลเลย → โครงตาราง
<LoadingGate isLoading={isLoading} fallback={<SkeletonTable columns={7} rows={8} />}>
  <DataTable ... />
</LoadingGate>

// มีข้อมูลอยู่แล้ว กำลังรีเฟรช → ทับพื้นที่เดิม (parent ต้อง relative)
<div className="relative">
  <DataTable ... />
  <LoadingOverlay isLoading={isRefreshing} />
</div>
```

## 4. ปุ่มและ dialog

```tsx
<Button isLoading={isSaving} onClick={save}>บันทึก</Button>   // สปินเนอร์ + กดซ้ำไม่ได้
<ConfirmDialog isLoading={isDeleting} ... />
<InlineLoading isLoading={isLoading} />                      // ป้ายเล็ก ๆ ข้างหัวข้อ
```

## เลือกตัวไหน

| สถานการณ์ | ใช้ |
| --- | --- |
| fallback ของ route (`loading.tsx`) | `createPageLoading(label)` |
| เปลี่ยนหน้าเอง | `useNavigate()` |
| ยังไม่มีข้อมูลเลย (ตาราง/การ์ด) | `LoadingGate` + `SkeletonTable` / `SkeletonCards` |
| โหลดไม่สำเร็จ | `LoadingGate` + prop `error` / `onRetry` (หรือ `LoadFailed`) |
| ยังไม่มีข้อมูลเลย แต่ไม่รู้เค้าโครง | `LoadingGate` (สปินเนอร์เป็นค่าเริ่มต้น) |
| มีข้อมูลแล้ว กำลังรีเฟรช | `LoadingOverlay` |
| ปุ่ม / dialog กำลังทำงาน | prop `isLoading` |
| ป้ายเล็ก ๆ ข้างหัวข้อหรือช่องเลือก | `InlineLoading` |
| state ของงาน async | `useLoading()` |
