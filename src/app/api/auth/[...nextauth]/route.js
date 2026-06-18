import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = async (req, ctx) => {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  
  let protocol = req.headers.get('x-forwarded-proto');
  if (!protocol) {
    try {
      const urlObj = new URL(req.url);
      protocol = urlObj.protocol.replace(':', '');
    } catch (e) {
      protocol = 'http';
    }
  }
  
  if (host) {
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  }
  
  return NextAuth(authOptions)(req, ctx);
};

export { handler as GET, handler as POST };
