import NextAuth from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      clientId: process.env.KUJANG_CLIENT_ID!,
      clientSecret: process.env.KUJANG_CLIENT_SECRET!,
      id: 'kujang-id',
      name: 'KUJANG ID IdP',
      type: 'oidc',
      issuer: 'https://id.pupuk-kujang.co.id',
      wellKnown:
        'https://id.pupuk-kujang.co.id/api/auth/.well-known/openid-configuration',
      authorization: {
        url: 'https://id.pupuk-kujang.co.id/api/auth/oauth2/authorize',
        params: { scope: 'openid profile email' },
      },
      token: 'https://id.pupuk-kujang.co.id/api/auth/oauth2/token',
      userinfo: 'https://id.pupuk-kujang.co.id/api/auth/oauth2/userinfo',
      client: {
        authorization_signed_response_alg: 'HS256',
        id_token_signed_response_alg: 'HS256',
      },
    },
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const oidcProfile = profile as {
          id?: string;
          sub?: string;
          roles?: string[];
          groups?: string[];
        };

        const oidcAccount = account as {
          access_token?: string;
          id_token?: string;
          legacy_id_token?: string;
        };

        token.id = oidcProfile.id || oidcProfile.sub || token.sub || '';
        token.accessToken = oidcAccount.access_token || '';
        token.idToken = oidcAccount.id_token || '';
        token.legacyIdToken = oidcAccount.legacy_id_token;
        token.roles = oidcProfile.roles || [];
        token.groups = oidcProfile.groups || [];
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles;
      session.user.groups = token.groups;
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      if (token.legacyIdToken) {
        session.legacyIdToken = token.legacyIdToken;
      }

      return session;
    },
  },
});
