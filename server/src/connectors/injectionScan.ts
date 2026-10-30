// Tool descriptions are model-visible text written by a third party. Anything that reads
// like an instruction to the model, rather than a description of the tool, is flagged.
const PATTERNS: [RegExp, string][] = [
  [/ignore (all |any )?(previous|prior|above) (instructions|rules)/i, 'สั่งให้ลืมคำสั่งก่อนหน้า'],
  [/(system|developer) prompt/i, 'อ้างถึง system prompt'],
  [/do not (tell|inform|mention)[^.]{0,40}(user|human)/i, 'สั่งให้ปิดบังผู้ใช้'],
  [/<\s*(important|system|instructions?)\s*>/i, 'แท็กคำสั่งแฝง'],
  [/(send|forward|upload|post)[^.]{0,60}(token|secret|password|api[_ -]?key|credential)/i, 'สั่งให้ส่งข้อมูลลับออก'],
  [/(read|cat|open)[^.]{0,30}(\.env|id_rsa|\.ssh|credentials)/i, 'สั่งให้อ่านไฟล์ลับ'],
  [/before (using|calling) (this|any other) tool/i, 'สั่งลำดับการเรียก tool อื่น'],
  [/[​-‏‪-‮⁠-⁤]/, 'มีอักขระซ่อน'],
  [/[A-Za-z0-9+/]{120,}={0,2}/, 'มีข้อความเข้ารหัสยาวผิดปกติ'],
];

export function scanDescription(text: string): string | undefined {
  for (const [re, label] of PATTERNS) if (re.test(text)) return label;
  return undefined;
}
