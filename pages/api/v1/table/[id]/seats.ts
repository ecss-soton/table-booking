import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../prisma/client';

import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import {Table} from "@prisma/client";

interface ResponseData {
    table: Table[],
    unallocated: string[],
}

interface ResponseError {
    error: boolean;
    message: string;
}

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

    const unallocated = members.filter((m) => !table.seatPositions.find((seat) => seat === m));
}
