// Demo data behind the mock connectors: the "Leads ชลบุรี" sheet from the design.
export type Lead = { row: number; shop: string; district: string; lineId?: string; contacted: boolean };

const shops = [
  'ครัวบ้านทุ่งสุขลา', 'ก๋วยเตี๋ยวเรือป้านิด', 'ข้าวมันไก่ศรีราชา', 'ส้มตำบางแสน', 'ร้านกาแฟริมเล', 'โจ๊กหน้าตลาด',
  'ซีฟู้ดอ่างศิลา', 'ข้าวต้มพัทยากลาง', 'หมูกระทะบ้านบึง', 'ราดหน้ายอดผัก', 'ติ่มซำหนองมน', 'เตี๋ยวต้มยำพนัสฯ',
  'ข้าวขาหมูสัตหีบ', 'ร้านขนมจีนแม่ศรี', 'ไก่ย่างเขาไม้แก้ว', 'ร้านน้ำชาเกาะสีชัง', 'ผัดไทยประตูผี ชลบุรี', 'ข้าวแกงป้าพร',
  'ชาบูอมตะ', 'ข้าวหมูแดงบางพระ', 'สุกี้ท่าเรือ', 'ร้านอาหารใต้ปักษ์', 'บะหมี่จับกังเมืองชล', 'ร้านเบเกอรี่ทุ่งทอง',
];

export const leads: Lead[] = shops.map((shop, i) => ({
  row: i + 2,
  shop,
  district: ['เมือง', 'ศรีราชา', 'บางแสน', 'พัทยา'][i % 4],
  lineId: i === 14 ? undefined : `@shop${100 + i}`,
  contacted: i === 3 || i === 9,
}));

/** CRM view: which shops already have an ES Account and an online presence. */
export const crm = new Map(
  leads.map((l, i) => [l.shop, { hasAccount: l.contacted, online: !(i === 5 || i === 17), owner: `[ชื่อเจ้าของร้าน ${l.row}]` }]),
);
