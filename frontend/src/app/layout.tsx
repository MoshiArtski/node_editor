import './globals.css';
import { Inter } from 'next/font/google';
import ReduxProvider from '../components/ReduxProvider'; // Import the ReduxProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'My App',
  description: 'My App with Redux',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider> {/* Wrap children with ReduxProvider to enable Redux */}
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
