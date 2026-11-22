import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <>
      <TopBar />
      <main className="page">
        <Outlet /> {/* the current page appears here */}
      </main>
    </>
  );
}