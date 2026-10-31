// One route per artboard in the "ES Bot — App Design" canvas.
export const routes = {
  workspace: '/',
  passport: '/passport',
  /** Opens the newest run; `runPath(id)` opens a specific one. */
  runInspector: '/runs/latest',
  sideChat: '/side-chat',
  fork: '/fork',
  artifacts: '/artifacts',
  imagePreview: '/images',
  settings: '/settings',
  connectors: '/connectors',
  models: '/models',

  mHome: '/m',
  mChat: '/m/chat',
  mSideChat: '/m/side-chat',
  mRail: '/m/rail',
  mFork: '/m/fork',
  mPassport: '/m/passport',
  mArtifact: '/m/artifact',
  mImage: '/m/image',
  mModel: '/m/model',
  mSettings: '/m/settings',
} as const;

export const runPath = (id: string) => `/runs/${id}`;
