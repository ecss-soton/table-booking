import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../prisma/client';

import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import {Table} from "@prisma/client";

interface ResponseData {
  yourTable?: string,
  yourRank?: number,
  tables: {
    locked: boolean,
    id: string,
    members: { name: string, plusOnes: string[] }[]
  }[]
}

interface ResponseError {
  error: boolean;
  message: string;
}

export default async function handler (req: NextApiRequest, res: NextApiResponse<ResponseData | ResponseError>) {
  if (req.method !== 'GET') return res.status(405).json({
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

  let tables = await prisma.table.findMany({
    include: {
      members: {
        orderBy: {
          joinedTableTime: 'asc'
        }
      }
    }
  });

  if (!tables) {
    tables = [];
  }

  // filter out all tables that are locked and you are not in
    tables = tables.filter((table) => {
        return !table.locked || table.members.find((member) => member.id === user.id);
    });

  const yourTable = user.tableId ?? undefined;
  let yourRank = tables.find((t) => t.id === yourTable)?.members.findIndex((elem) => elem.id === user.id);

  res.status(200).json({
    yourTable: yourTable, yourRank, tables: tables.map((table) => {
      return {
        locked: table.locked, id: table.id, members: table.members.map((member) => {
          return {
            name: member.displayName ?? '',
            plusOnes: member.plusOnes ?? [],
          };
        })
      };
    })
  });
}
