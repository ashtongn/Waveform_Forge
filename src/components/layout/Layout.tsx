import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  // Wide shell (max-w-screen-2xl) for data-dense signed-in app pages; the
  // default narrower width keeps marketing/auth pages comfortable to read.
  wide?: boolean;
}

export default function Layout({ wide = false }: LayoutProps) {
  const container = wide ? 'max-w-screen-2xl' : 'max-w-5xl';
  return (
    <div className="flex min-h-full flex-col">
      <Header containerClass={container} />
      <main className={`mx-auto w-full ${container} flex-1 px-6 py-10`}>
        <Outlet />
      </main>
      <Footer containerClass={container} />
    </div>
  );
}
