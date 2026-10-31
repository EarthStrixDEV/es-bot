import { useEffect, type ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { routes } from './routes';

// Hosted previews only carry a plain "#name" in the URL, so each route gets a hash name.
const names: Record<string, string> = {
  '/screens': 'screens',
  ...Object.fromEntries(
    Object.values(routes).map((path) => [path, path === '/' ? 'workspace' : path.slice(1).replace(/[^a-z0-9]+/gi, '-').replace('settings', 'app-settings')]),
  ),
};
const paths = Object.fromEntries(Object.entries(names).map(([p, n]) => [n, p]));
const fromHash = () => paths[location.hash.slice(1)] ?? '/screens';

function HashSync() {
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const name = names[loc.pathname];
    if (name && location.hash.slice(1) !== name) history.replaceState(null, '', `#${name}`);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    const onHash = () => navigate(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate]);
  return null;
}

/** Router for the static preview build: in-memory history mirrored to `#name`. */
export function PreviewRouter({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={[fromHash()]}>
      <HashSync />
      {children}
    </MemoryRouter>
  );
}
