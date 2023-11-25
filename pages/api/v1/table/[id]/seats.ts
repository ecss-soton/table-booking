import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../prisma/client';

import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';

interface ResponseData {
    table: {
        locked: boolean,
        id: string,
        seatPositions: string[],
        members: { name: string, plusOnes: string[] }[]
    },
    unallocated: string[],
}

interface ResponseError {
    error: boolean;
    message: string;
}

function sameElements<T>(lhs: T[], rhs: T[]): boolean {
    return (lhs.length === rhs.length) && lhs.every((element, index) => element === rhs[index]);
}

// We assume there will not be two people with the same name on the same table because I'm lazy
export default async function handler (req: NextApiRequest, res: NextApiResponse<ResponseData | ResponseError>) {
    if (!(req.method === 'GET' || req.method == 'PATCH')) return res.status(405).json({
        error: true, message: 'Only HTTP verb GET is permitted',
    });

    const attemptedAuth = await unstable_getServerSession(req, res, authOptions);

    if (!attemptedAuth) {
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

    const tableId = req.query.id;

    if (user.tableId !== tableId) {
        return res.status(401).json({
            error: true, message: 'Not your table.'
        })
    }

    const table = await prisma.table.findUnique({
        where: {
            id: tableId
        },
        include: {
            members: true
        }
    });

    if (!table) {
        return res.status(404).json({
            error: true, message: 'This table does not exist.',
        });
    }

    const members = table.members.reduce((arr: string[], m) => {
        arr.push(m.displayName)
        arr.push(...m.plusOnes)
        return arr
    }, []);

    let newPositions = table.seatPositions.map((s) => members.find(m => m === s) ? s : '')

    if (req.method === 'PATCH') {
        if (!Array.isArray(req.body) || req.body.length != 10) {
            return res.status(404).json({
                error: true, message: 'Must update seat position using an array of length 10',
            });
        }

        const arrNames = req.body.filter((e) => e != "");

        if (new Set(arrNames).size !== arrNames.length) {
            return res.status(404).json({
                error: true, message: 'Array contains same name multiple times',
            });
        }

        if (!arrNames.every((e) => e && typeof e === 'string')) {
            return res.status(404).json({
                error: true, message: 'Array must contain strings.',
            });
        }

        if (!arrNames.every((e) => members.find((m) => m === e))) {
            return res.status(404).json({
                error: true, message: 'Array must only contain names of members of the table.',
            });
        }

        newPositions = req.body;
    }

    if (!sameElements(newPositions, table.seatPositions)) {
        const updatedTable = await prisma.table.update({
            where: {
                id: tableId
            },
            data: {
                seatPositions: newPositions
            }
        })

        table.seatPositions = updatedTable.seatPositions;
    }

    const unallocated = members.filter((m) => !table.seatPositions.find((seat) => seat === m));

    res.status(200).json({
        table: {
            locked: table.locked, id: table.id, seatPositions: table.seatPositions, members: table.members.map((member) => {
                return {
                    name: member.displayName ?? '',
                    plusOnes: member.plusOnes ?? [],
                };
            })
        },
        unallocated
    })
}
