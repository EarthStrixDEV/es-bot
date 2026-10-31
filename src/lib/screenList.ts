import { routes } from './routes';

/** Every artboard of the design, in canvas order. */
export const screenList = {
  desktop: [
    { to: routes.workspace, title: '01 · Workspace + Session rail' },
    { to: routes.passport, title: '02 · Bot Passport' },
    { to: routes.runInspector, title: '03 · Run Inspector' },
    { to: routes.sideChat, title: '04 · Side Chat (กระซิบข้างหู)' },
    { to: routes.fork, title: '05 · Fork Session' },
    { to: routes.artifacts, title: '06 · Artifacts' },
    { to: routes.imagePreview, title: '07 · Image Preview' },
    { to: routes.settings, title: '08 · Settings' },
    { to: routes.connectors, title: '09 · MCP Connectors' },
    { to: routes.models, title: '10 · Model Selector' },
  ],
  mobile: [
    { to: routes.mHome, title: 'M01 · รายชื่อ Bot' },
    { to: routes.mChat, title: 'M02 · แชต + Approval' },
    { to: routes.mSideChat, title: 'M03 · Side Chat' },
    { to: routes.mRail, title: 'M04 · Session rail' },
    { to: routes.mFork, title: 'M05 · Fork Session' },
    { to: routes.mPassport, title: 'M06 · Bot Passport' },
    { to: routes.mArtifact, title: 'M07 · Artifact' },
    { to: routes.mImage, title: 'M08 · Image Preview' },
    { to: routes.mModel, title: 'M09 · Model Selector' },
    { to: routes.mSettings, title: 'M10 · Settings + Connectors' },
  ],
} as const;
