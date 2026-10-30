import { Navigate, Route, Routes } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { Workspace } from '@/screens/desktop/workspace/Workspace';
import { Passport } from '@/screens/desktop/Passport';
import { RunInspector } from '@/screens/desktop/RunInspector';
import { SideChat } from '@/screens/desktop/SideChat';
import { Fork } from '@/screens/desktop/Fork';
import { Artifacts } from '@/screens/desktop/Artifacts';
import { ImagePreview } from '@/screens/desktop/ImagePreview';
import { Settings } from '@/screens/desktop/Settings';
import { Connectors } from '@/screens/desktop/Connectors';
import { ModelSelector } from '@/screens/desktop/ModelSelector';
import { MHome } from '@/screens/mobile/MHome';
import { MChat } from '@/screens/mobile/MChat';
import { MSideChat } from '@/screens/mobile/MSideChat';
import { MRail } from '@/screens/mobile/MRail';
import { MFork } from '@/screens/mobile/MFork';
import { MPassport } from '@/screens/mobile/MPassport';
import { MArtifact } from '@/screens/mobile/MArtifact';
import { MImage } from '@/screens/mobile/MImage';
import { MModel } from '@/screens/mobile/MModel';
import { MSettings } from '@/screens/mobile/MSettings';

export function App() {
  return (
    <Routes>
      <Route path={routes.workspace} element={<Workspace />} />
      <Route path={routes.passport} element={<Passport />} />
      <Route path={routes.runInspector} element={<RunInspector />} />
      <Route path={routes.sideChat} element={<SideChat />} />
      <Route path={routes.fork} element={<Fork />} />
      <Route path={routes.artifacts} element={<Artifacts />} />
      <Route path={routes.imagePreview} element={<ImagePreview />} />
      <Route path={routes.settings} element={<Settings />} />
      <Route path={routes.connectors} element={<Connectors />} />
      <Route path={routes.models} element={<ModelSelector />} />

      <Route path={routes.mHome} element={<MHome />} />
      <Route path={routes.mChat} element={<MChat />} />
      <Route path={routes.mSideChat} element={<MSideChat />} />
      <Route path={routes.mRail} element={<MRail />} />
      <Route path={routes.mFork} element={<MFork />} />
      <Route path={routes.mPassport} element={<MPassport />} />
      <Route path={routes.mArtifact} element={<MArtifact />} />
      <Route path={routes.mImage} element={<MImage />} />
      <Route path={routes.mModel} element={<MModel />} />
      <Route path={routes.mSettings} element={<MSettings />} />

      <Route path="*" element={<Navigate to={routes.workspace} replace />} />
    </Routes>
  );
}
