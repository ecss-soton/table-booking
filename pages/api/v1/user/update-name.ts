import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../prisma/client';

interface ResponseError {
    error: boolean;
    message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<{} | ResponseError>) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({
            error: true,
            message: 'Only HTTP verb PATCH is permitted',
        });
    }

    const session = await unstable_getServerSession(req, res, authOptions);

    if (!session?.microsoft.email) {
        return res.status(400).json({
            error: true,
            message: 'You must be authenticated to update your name',
        });
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({
            error: true,
            message: 'name must be a non-empty string',
        });
    }

    if (name.trim().length === 0) {
        return res.status(400).json({
            error: true,
            message: 'name cannot be empty',
        });
    }

    try {
        const user = await prisma.user.update({
            where: {
                sotonId: session.microsoft.email.split('@')[0],
            },
            data: {
                displayName: name.trim(),
                firstName: name.trim(),
            },
        });

        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        return res.status(200).json({});
    } catch (error) {
        console.error('Error updating user name:', error);
        return res.status(500).json({
            error: true,
            message: 'Failed to update name',
        });
    }
}
