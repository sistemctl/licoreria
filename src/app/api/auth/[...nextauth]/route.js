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

  // Force secure cookies ONLY if protocol is https, preventing cookie rejection on HTTP local IPs
  const dynamicAuthOptions = {
    ...authOptions,
    useSecureCookies: protocol === 'https'
  };
  
  return NextAuth(dynamicAuthOptions)(req, ctx);
};

export { handler as GET, handler as POST };
