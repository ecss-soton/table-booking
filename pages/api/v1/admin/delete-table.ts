import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../prisma/client';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { isAdmin } from '../../../../lib/adminUtils';

interface ResponseSuccess {
  success: boolean;
  message: string;
}

interface ResponseError {
  error: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseSuccess | ResponseError>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      error: true, 
      message: 'Only HTTP verb DELETE is permitted',
    });
  }

  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session?.microsoft?.email) {
    return res.status(401).json({
      error: true, 
      message: 'You must be authenticated',
    });
  }

  const sotonId = session.microsoft.email.split('@')[0];
  
  if (!isAdmin(sotonId)) {
    return res.status(403).json({
      error: true, 
      message: 'Admin privileges required',
    });
  }

  const { tableId } = req.body;

  if (!tableId) {
    return res.status(400).json({
      error: true, 
      message: 'Table ID is required',
    });
  }

  try {
    // First, update all users who were in this table to remove their table association
    await prisma.user.updateMany({
      where: {
        tableId: tableId
      },
      data: {
        tableId: null,
        joinedTableTime: null
      }
    });

    // Then delete the table
    const deletedTable = await prisma.table.delete({
      where: {
        id: tableId
      }
    });

    return res.status(200).json({
      success: true,
      message: `Table ${tableId} has been deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting table:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to delete table'
    });
  }
}