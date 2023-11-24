import {TableCard} from '@/components/TableCard';
import {Button, Card, Checkbox,TextInput, Notification, Modal} from '@mantine/core';
import {EventHandler, KeyboardEvent, KeyboardEventHandler, useRef, useState} from 'react';
import {Table} from '@prisma/client';
import useSWR from 'swr';
import fetcher from '../middleware/fetch';
import Link from "next/link";
import {useRouter} from "next/router";
import {useForm} from "@mantine/form";
import validator from "validator";
import {IncomingMessage, ServerResponse} from "http";
import {NextApiRequestCookies} from "next/dist/server/api-utils";
import {NextApiRequest, NextApiResponse} from "next";
import {unstable_getServerSession} from "next-auth";
import {authOptions} from "./api/auth/[...nextauth]";
import prisma from "../prisma/client";
import {User} from "@prisma/client";
import axios from "axios";

export default function Tables({ url, user }: { url: string, user: User }) {



    const {data, mutate} = useSWR<{
        yourTable?: string, yourRank?: number, tables: Table[]
    }>('/api/v1/tables', fetcher, {refreshInterval: 3000});

    const [buttonLoading, setButtonLoading] = useState(false);
    const [showJoinable, setShowJoinable] = useState(false);
    const [createTableError, setCreateTableError] = useState(false);



    const router = useRouter()
    const { join } = router.query

    const [joinedFromCode, setjoinedFromCode] = useState(false);

    if (data?.tables && data.tables.length != 0) {
        data.tables.sort(t => t.id === data.yourTable ? -1 : 1)
    }

    return (
        <>
            <div className='flex flex-col items-center justify-center w-full flex-1 px-20 text-center'>
                <h1 className="font-bold text-2xl m-2">Choose your seat</h1>
                <div className="flex flex-wrap flex-col">
                    <div className='flex flex-wrap flex-row items-end'>
                        <Link href="/" passHref>
                            <Button variant='outline' className='mx-5' component="a">
                                Back to all tables
                            </Button>
                        </Link>
                    </div>


                </div>



                <div className="flex flex-wrap">


                    <div>

                        TODO Seat display

                    </div>

                    <div>

                        <h2 className='font-bold text-xl m-2'>Your table</h2>
                        {data?.tables ? (data.tables.length == 0 ? null : data.tables.map(v => {
                            const userCount = 1 + user.plusOnes.length;
                            const realMemberCount = v.members.reduce((sum, m) => m.plusOnes.length + 1 + sum, 0);
                            if (v.id === data.yourTable) {
                                return (<TableCard key={v.id} overfull={realMemberCount > (10 - userCount)} userRank={data.yourRank} url={url} {...v} />);
                            }
                            if (showJoinable && (v.locked || realMemberCount > (10 - userCount))) {
                                return null;
                            }
                            return <></>;
                        })) : <div/>}


                    </div>



                </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context: { req: (IncomingMessage & { cookies: NextApiRequestCookies; }) | NextApiRequest; res: ServerResponse | NextApiResponse<any>; }) {
    const session = await unstable_getServerSession(context.req, context.res, authOptions)

    if (!session?.microsoft.email) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false,
            },
        }
    }

    const user = await prisma.user.findUnique({
        where: {
            sotonId: session.microsoft.email.split('@')[0],
        },
    });


    return {
        props: {
            url: process.env.NEXTAUTH_URL,
            user: JSON.parse(JSON.stringify(user)),
        },
    }
}

Tables.auth = true;