import {NextApiRequest, NextApiResponse} from 'next';
import prisma from '../../../prisma/client';
import {unstable_getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]';

// interface RequestData {
//   table?: string
// }

interface ResponseError {
    error: boolean;
    message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<{} | ResponseError>) {
    if (req.method !== 'POST') return res.status(405).json({
        error: true, message: 'Only HTTP verb POST is permitted',
    });

    const attemptedAuth = await unstable_getServerSession(req, res, authOptions);

    if (!attemptedAuth?.microsoft.email) {
        return res.status(400).json({
            error: true, message: 'You must include the session token with the Authorization header',
        });
    }

    try {
        await prisma.user.update({
            where: {
                id: attemptedAuth.id,
            },
            data: {
                tableId: null,
                joinedTableTime: null
            }
        });

        await prisma.table.deleteMany({
            where: {
                members: {
                    none: {}
                }
            }
        });

        res.status(200).json({});
    } catch {
        return res.status(400).json({
            error: true, message: 'There was an error leaving that table',
        });
    }
}
