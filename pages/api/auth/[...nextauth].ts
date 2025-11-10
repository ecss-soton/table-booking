import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider, { AzureADProfile } from 'next-auth/providers/azure-ad';
import {PrismaAdapter} from "@next-auth/prisma-adapter"
import prisma from "../../../prisma/client";
import axios from "axios";
import {NextApiRequest, NextApiResponse} from "next";
import { OAuthConfig } from 'next-auth/providers';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    pages: {
        signIn: '/signin',
        signOut: '/signout',

    },
    providers: [
        AzureADProvider({
            clientId: String(process.env.AZURE_AD_CLIENT_ID),
            clientSecret: String(process.env.AZURE_AD_CLIENT_SECRET),
            tenantId: process.env.AZURE_AD_TENANT_ID,
            authorization: {
                params: {
                    scope: "openid profile User.Read email",
                },
            }
        }),
    ],
    callbacks: {
        async session({session, token, user}) {
            // Send properties to the client, like an access_token from a provider.
            session.firstName = user.firstName;
            session.lastName = user.lastName;
            session.microsoft = {
                email: user.sotonId + '@soton.ac.uk',
            };
            session.id = user.id;
            return session
        },
        async redirect({ url, baseUrl }) {
            // Ensure redirects remain within the app and respect basePath when set via NEXTAUTH_URL
            // If url is a relative path, prefix with baseUrl (which should include basePath when NEXTAUTH_URL is set)
            if (url.startsWith('/')) return `${baseUrl}${url}`
            try {
                const target = new URL(url)
                const base = new URL(baseUrl)
                if (target.origin === base.origin) return url
            } catch {}
            return baseUrl
        },
        async signIn({ user, account, profile, email, credentials }) {
            const holder = await prisma.ticketHolders.findFirst({
                where: {
                    sotonId: user.sotonId || undefined,
                }
            })

            return !!holder;
            // return true
        }
    }
};

async function getPlusOnes(sotonId: string): Promise<{ plusOnes: string[] }> {
    const holder = await prisma.ticketHolders.findFirst({
        where: {
            sotonId: sotonId
        }
    })

    return { plusOnes: holder?.plusOnes || [] }
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    // @ts-ignore
    (authOptions.providers[0] as OAuthConfig<AzureADProfile>).profile = async function profile(profile, tokens) {

        tokens.ext_expires_in = undefined;

        let sotonVerifyData;

        try {
            sotonVerifyData = await axios({
                method: 'GET',
                url: `https://sotonverify.link/api/v2/user?sotonId=${profile.email.split('@')[0]}`,
                headers: {
                    Authorization: String(process.env.SOTON_VERIFY_API_AUTH)
                },
                data: {
                    guildId: '1008673689665032233',
                }
            })

            const data = sotonVerifyData.data;

            const plusOne = await getPlusOnes(data.sotonId)

            return {
                id: data.sotonId,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: `${data.firstName} ${data.lastName} (${data.sotonId})`,
                sotonId: data.sotonId,
                plusOnes: plusOne.plusOnes,
            }
        } catch {
            const data = await fetch(
                `https://graph.microsoft.com/v1.0/me/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                    },
                }
            )

            const sotonData = await data.json();

            const plusOne = await getPlusOnes(sotonData.mail.split('@')[0])

            return {
                id: sotonData.mail.split('@')[0],
                firstName: sotonData.givenName,
                lastName: sotonData.surname,
                displayName: sotonData.displayName,
                sotonId: sotonData.mail.split('@')[0],
                plusOnes: plusOne.plusOnes,
            }

        }

    }
    return await NextAuth(req, res, authOptions)
}
