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
import { isAdmin } from "../lib/adminUtils";

const base = '/winterball';

export default function Tables({ url, user, isAdmin: userIsAdmin }: { url: string, user: User, isAdmin: boolean }) {



    const {data, mutate} = useSWR<{
        yourTable?: string, yourRank?: number, tables: Table[]
    }>(`/api/v1/tables`, fetcher, {refreshInterval: 3000});

    const [buttonLoading, setButtonLoading] = useState(false);
    const [createTableError, setCreateTableError] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState(user.displayName);
    const [updateNameLoading, setUpdateNameLoading] = useState(false);
    const [updateNameError, setUpdateNameError] = useState(false);


    const createNewTable = async () => {
        setButtonLoading(true);

        const res = await fetch(`${base}/api/v1/join`, {
            method: 'post', headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },

            //make sure to serialize your JSON body
            body: JSON.stringify({})
        });

        if (res.ok) {
            await mutate();
            setButtonLoading(false);
        } else {
            try {
                const errorData = await res.json();
                setCreateTableError(errorData.message || 'Failed to create table');
            } catch {
                setCreateTableError('Failed to create table');
            }
            setButtonLoading(false);
            setTimeout(() => setCreateTableError(null), 7_000);
        }
    };

    const router = useRouter()
    const { join } = router.query

    const [joinedFromCode, setjoinedFromCode] = useState(false);

    const joinTable = async () => {
        
        const res = await fetch(`${base}/api/v1/join`, {
            method: 'post', headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },

            body: JSON.stringify({table: join, fromCode:true})
        });

        if (res.ok) {
            await mutate()
            setjoinedFromCode(false)
        }
    };

    const updateFirstName = async () => {
        if (!nameInput.trim()) {
            setUpdateNameError(true);
            setTimeout(() => setUpdateNameError(false), 5_000);
            return;
        }

        setUpdateNameLoading(true);

        const res = await fetch(`${base}/api/v1/user/update-name`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: nameInput })
        });

        if (res.ok) {
            setUpdateNameLoading(false);
            // Update the user object in the page
            user.firstName = nameInput;
        } else {
            setUpdateNameError(true);
            setTimeout(() => setUpdateNameError(false), 5_000);
            setUpdateNameLoading(false);
        }
    };

    if (data?.tables && data.tables.length != 0) {
        data.tables.sort(t => t.id === data.yourTable ? -1 : 1)
    }

    return (
        <>
            <div className='flex flex-col items-center justify-center w-full flex-1 px-5 text-center'>
                <h1 className="font-bold text-2xl m-2">View tables</h1>
                <div className="flex flex-wrap flex-col">
                    <Card className="m-5" withBorder radius="md" p="md">
                        <Card.Section className="p-4" mt="md">
                            <h3 className="font-bold text-lg mb-3">Update your name</h3>
                            <div className="flex flex-row gap-3 items-end justify-center">
                                <TextInput
                                    placeholder="Name"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.currentTarget.value)}
                                    style={{ flex: 1, maxWidth: '300px' }}
                                />
                                <Button
                                    onClick={updateFirstName}
                                    loading={updateNameLoading}
                                    color={updateNameError ? 'red' : 'blue'}
                                >
                                    Update Name
                                </Button>
                            </div>
                        </Card.Section>
                    </Card>
                    <Modal
                        opened={joinedFromCode || !!join}
                        onClose={() => {
                            setjoinedFromCode(false)
                            router.push("/tables")
                        }}
                        withCloseButton={false}
                        title="Join this table?"
                    >
                        <div>
                            <Link href="/tables" passHref>
                                <Button color="green" variant='filled' className='' component="a" onClick={joinTable}>
                                    Accept
                                </Button>
                            </Link>
                            <Link href="/tables" passHref>
                                <Button variant="outline" color="red" className='mx-5' component="a" onClick={() => setjoinedFromCode(false)}>
                                    Reject
                                </Button>
                            </Link>
                        </div>
                    </Modal>
                    <div className='flex flex-wrap flex-row items-end'>
                        <Button className="mx-5" color={!createTableError ? 'default' : 'red'} disabled={!data?.tables} loading={buttonLoading} onClick={createNewTable}>
                            Create new table
                        </Button>
                        {createTableError && (
                            <div className="mx-5 text-red-600 text-sm max-w-sm">
                                {createTableError}
                            </div>
                        )}
                        <Link href="/" passHref>
                            <Button variant='outline' className='mx-5' component="a">
                                Back
                            </Button>
                        </Link>
                    </div>

                </div>
                <div className="flex flex-wrap">
                    {data?.tables ? (data.tables.length == 0 ? <p>There are not currently any tables you can join</p> : data.tables.map(v => {
                        const userCount = 1 + user.plusOnes.length;
                        // @ts-ignore
                        const realMemberCount = v.members.reduce((sum, m) => m.plusOnes.length + 1 + sum, 0);
                        if (v.id === data.yourTable) {
                            return (<TableCard key={v.id} overfull={realMemberCount > (10 - userCount)} userRank={data.yourRank} url={url} isAdmin={userIsAdmin} {...v} />);
                        }
                        if (realMemberCount > (10 - userCount)) {
                            return <></>;
                        }
                        return (<TableCard key={v.id} overfull={realMemberCount > (10 - userCount)} url={url} isAdmin={userIsAdmin} {...v}/>);
                    })) : <p>There are not currently any tables you can join</p>}

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

    const sotonId = session.microsoft.email.split('@')[0];

    // Check if user is admin
    const userIsAdmin = isAdmin(sotonId);

    // Get current plusOnes from TicketHolders table
    const holder = await prisma.ticketHolders.findFirst({
        where: {
            sotonId: sotonId
        }
    });

    const currentPlusOnes = holder?.plusOnes || [];

    // Update user with latest plusOnes data
    const user = await prisma.user.update({
        where: {
            sotonId: sotonId,
        },
        data: {
            plusOnes: currentPlusOnes
        }
    });

    return {
        props: {
            url: process.env.NEXTAUTH_URL,
            user: JSON.parse(JSON.stringify(user)),
            isAdmin: userIsAdmin,
        },
    }
}

Tables.auth = true;
