import {NextApiRequest, NextApiResponse} from 'next';
import prisma from '../../../prisma/client';
import {unstable_getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]';
import { nanoid } from 'nanoid'

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

    const user = await prisma.user.findUnique({
        where: {
            id: attemptedAuth.id,
        }
    });

    if (!user) {
        return res.status(404).json({
            error: true, message: 'This user does not exist.',
        });
    }

    if (req.body.table) {
        // user wants to join a specific table.
        if (typeof req.body.table !== "string") return res.status(405).json({
            error: true, message: 'table parameter must be a string id.',
        });

        if (user.tableId == req.body.table) return res.status(405).json({
            error: true, message: 'already in table.',
        });

        const table = await prisma.table.findFirst({
            where: {
                id: req.body.table
            }, include: {
                members: true
            }
        });

        if (!table) {
            return res.status(405).json({
                error: true, message: 'table parameter must be between 0 and number of tables.',
            });
        }

        const userCount = 1 + user.plusOnes.length;
        const realMemberCount = table.members.reduce((sum, m) => m.plusOnes.length + 1 + sum, 0);

        if (realMemberCount > (10 - userCount)  || (!req.body.fromCode && table.locked)) {
            return res.status(405).json({
                error: true, message: 'table is already filled or locked.',
            });
        }


        const updatedUser = await prisma.user.update({
            where: {
                id: attemptedAuth.id,
            }, data: {
                tableId: table.id, joinedTableTime: new Date()
            }
        });

        if (!updatedUser) return res.status(405).json({
            error: true, message: 'table does not exist.',
        });

    } else {
        const user = await prisma.user.update({
            where: {
                id: attemptedAuth.id,
            },
            data: {
                joinedTableTime: new Date(),
                table: {
                    create: {
                        id: nanoid(8)
                    }
                }
            }
        });

        if (!user) return res.status(405).json({
            error: true, message: 'could not create table.',
        });
    }

    await prisma.table.deleteMany({
        where: {
            members: {
                none: {}
            }
        }
    });

    res.status(200).json({});
}
