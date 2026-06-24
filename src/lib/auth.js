import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Usuario y contraseña requeridos');
        }

        const user = await prisma.usuario.findUnique({
          where: { username: credentials.username },
          include: { rol: true }
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        if (!user.activo) {
          throw new Error('El usuario está desactivado');
        }

        // Verificar bloqueo temporal
        if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
          const minutosRestantes = Math.ceil((user.bloqueadoHasta.getTime() - Date.now()) / 60000);
          throw new Error(`Cuenta bloqueada temporalmente. Intente nuevamente en ${minutosRestantes} minutos.`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          // Incrementar intentos fallidos
          const nuevosIntentos = user.intentosFallidos + 1;
          let bloqueadoHasta = null;

          if (nuevosIntentos >= 5) {
            bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // Bloqueo de 15 minutos
          }

          await prisma.usuario.update({
            where: { id: user.id },
            data: {
              intentosFallidos: nuevosIntentos,
              bloqueadoHasta
            }
          });

          // Registrar en auditoría el intento fallido
          await prisma.auditoria.create({
            data: {
              usuarioId: user.id,
              accion: 'LOGIN_FALLIDO',
              tablaAfectada: 'usuarios',
              registroId: user.id,
              datosNuevos: { intentosFallidos: nuevosIntentos, bloqueadoHasta },
              ipAddress: '127.0.0.1'
            }
          });

          if (nuevosIntentos >= 5) {
            throw new Error('Has superado el número de intentos permitidos. Cuenta bloqueada por 15 minutos.');
          } else {
            throw new Error(`Contraseña incorrecta. Intentos restantes: ${5 - nuevosIntentos}`);
          }
        }

        // Login exitoso: reiniciar intentos y actualizar último login
        await prisma.usuario.update({
          where: { id: user.id },
          data: {
            intentosFallidos: 0,
            bloqueadoHasta: null,
            ultimoLogin: new Date()
          }
        });

        // Registrar en auditoría el login exitoso
        await prisma.auditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'LOGIN_EXITOSO',
            tablaAfectada: 'usuarios',
            registroId: user.id,
            ipAddress: '127.0.0.1'
          }
        });

        return {
          id: user.id,
          name: user.nombre,
          email: user.username,
          rol: {
            id: user.rol.id,
            nombre: user.rol.nombre,
            permisos: user.rol.permisos
          }
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.rol = token.rol;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
};
