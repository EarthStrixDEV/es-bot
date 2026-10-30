import { MobileScreen } from '@/components/layout/MobileScreen';
import { Button, Card, IconButton, IconLink, Meter, Pill } from '@/components/ui';
import { routes } from '@/lib/routes';

const branches = ['[สาขา 1]', '[สาขา 2]', '[สาขา 3]'];

const tiles = [
  { label: 'จำนวนบิล', value: '[บิล]' },
  { label: 'ต่อบิลเฉลี่ย', value: '[฿]' },
];

/** M07 · Artifact */
export function MArtifact() {
  return (
    <MobileScreen title="ยอดขายสาขา" className="bg-sand">
      <header className="flex items-center gap-2 border-b border-line bg-paper px-3 pb-2.5 pt-3">
        <IconLink to={routes.mHome} icon="back" label="กลับ" tone="plain" size={44} iconSize={20} strokeWidth={2} />
        <div className="flex flex-1 flex-col">
          <h1 className="m-0 text-base font-semibold">ยอดขายสาขา</h1>
          <span className="font-mono text-2xs text-muted">Dashboard · POS Ops · v3</span>
        </div>
        <IconButton icon="share" label="แชร์" size={44} iconSize={18} />
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-line bg-paper px-4 py-2.5">
        <Pill tone="ok">Live · ES POS · read-only</Pill>
        <Pill>ทุก 15 นาที</Pill>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <Card variant="paper" className="gap-1 rounded-[18px]">
          <span className="text-[13px] text-muted">ยอดขายรวม · เมื่อวาน</span>
          <span className="font-mono text-[32px] font-medium">[฿]</span>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <Card key={t.label} as="div" variant="paper" className="p-3.5">
              <span className="text-xs text-muted">{t.label}</span>
              <span className="font-mono text-xl">{t.value}</span>
            </Card>
          ))}
        </div>

        <Card variant="paper" aria-labelledby="branches" className="gap-2.5 rounded-[18px]">
          <h2 id="branches" className="m-0 text-sm font-semibold">
            รายสาขา
          </h2>
          {branches.map((b) => (
            <div key={b} className="flex flex-col gap-1">
              <div className="flex justify-between text-[13px]">
                <span>{b}</span>
                <span className="font-mono">[฿]</span>
              </div>
              <Meter value={100} label={`ยอดขาย ${b}`} height={10} color="rgb(35 72 216 / 0.25)" />
            </div>
          ))}
        </Card>

        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-paper px-3.5 py-3 text-left shadow-ring hover:bg-sand"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand font-mono text-[13px]">%</span>
          <span className="flex flex-1 flex-col">
            <span className="font-medium">Mini App · คำนวณค่าคอม</span>
            <span className="text-xs text-muted">แตะเพื่อเปิดใช้</span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-line bg-paper px-4 pb-6 pt-2.5">
        <Button className="h-11 px-2 text-sm">ปักหมุด</Button>
        <Button className="h-11 px-2 text-sm">คอมเมนต์</Button>
        <Button variant="primary" className="h-11 px-2 text-sm">
          ให้ Bot แก้
        </Button>
      </div>
    </MobileScreen>
  );
}
