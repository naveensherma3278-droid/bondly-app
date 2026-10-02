import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Bondly — AI Relationship Assistant',
  description: 'Never miss an important moment. Strengthen relationships automatically.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
