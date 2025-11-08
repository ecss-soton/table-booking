import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma/client';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

// interface RequestData {
//   shouldLock: boolean
// }

interface ResponseData {
  locked: boolean
}

interface ResponseError {
  error: boolean;
  message: string;
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<ResponseData | ResponseError>) {
  if (req.method !== 'POST') return res.status(405).json({
    error: true, message: 'Only HTTP verb POST is permitted',
  });

  if (!(req.body.shouldLock === true || req.body.shouldLock === false)) return res.status(405).json({
    error: true, message: 'Must contain the boolean parameter shouldLock.',
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

  let table;
  if (user?.tableId) {
    table = await prisma.table.findUnique({
      where: {
        id: user.tableId
      },
      include: {
        members: {
          orderBy: {
            joinedTableTime: "asc"
          }
        }
      }
    })
  }

  if (!user || !table) return res.status(404).json({
    error: true, message: 'Could not find user or user not in an alley.',
  });

  if (table.members[0].id !== user.id) return res.status(405).json({
    error: true, message: 'The user does not have the right rank.',
  });

  if (table.locked === req.body.shouldLock) return res.status(405).json({
    error: true, message: 'The alley is already locked/unlocked.',
  });

  const updateTable = await prisma.table.update({
    where: {
      id: table.id
    },
    data: {
      locked: !table.locked
    }
  })


  if (!updateTable) {
    return res.status(500).json({
      error: true, message: 'Unable to update alley',
    });
  }

  res.status(200).json({
    locked: updateTable.locked
  });
}
