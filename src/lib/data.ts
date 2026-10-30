import { routes } from './routes';

// Shared demo content used by several screens. Unknown figures stay as [placeholders].
export const bots = {
  sales: { name: 'Sales Outbound', color: '#E8590C' },
  chief: { name: 'มินจู · Chief', color: '#7048E8' },
  pos: { name: 'POS Ops', color: '#1C7ED6' },
  content: { name: 'Content Factory', color: '#2F9E44' },
} as const;

export const user = { name: 'พี่เอิร์ธ', initial: 'อ' };

export type BotListItem = {
  id: string;
  name: string;
  colors: string[]; // 1 = bot, 2 = group chat
  time: string;
  timeTone?: 'muted' | 'accent';
  status: string;
  statusTone?: 'muted' | 'warn';
  to?: string;
  mobileTo?: string;
};

export const needsYou: BotListItem[] = [
  {
    id: 'sales',
    name: bots.sales.name,
    colors: [bots.sales.color],
    time: '10:42',
    status: 'รออนุมัติ: ส่ง 22 ข้อความ',
    statusTone: 'warn',
    to: routes.workspace,
    mobileTo: routes.mChat,
  },
];

export const salesFork = { label: 'Fork · โทนเป็นกันเอง', from: 'จาก #3', to: routes.fork, mobileTo: routes.mFork };

export const team: BotListItem[] = [
  { id: 'chief', name: bots.chief.name, colors: [bots.chief.color], time: '10:30', status: 'สรุปงานเช้านี้ส่งเข้า LINE แล้ว' },
  {
    id: 'pos',
    name: bots.pos.name,
    colors: [bots.pos.color],
    time: 'กำลังทำงาน',
    timeTone: 'accent',
    status: 'ตรวจยอดขายสาขา · ขั้น 2/5',
    to: routes.artifacts,
    mobileTo: routes.mArtifact,
  },
  {
    id: 'content',
    name: bots.content.name,
    colors: [bots.content.color],
    time: 'เมื่อวาน',
    status: 'ร่างโพสต์ 3 ชิ้น รอพี่ดู',
    to: routes.imagePreview,
    mobileTo: routes.mImage,
  },
  { id: 'launch-room', name: 'ห้องเปิดตัว POS', colors: [bots.chief.color, bots.pos.color], time: 'จ.', status: 'group chat · 4 Bot' },
];
