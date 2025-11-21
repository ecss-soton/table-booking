import {TableCard} from '@/components/TableCard';
import {
    Button,
    Card,
    Checkbox,
    TextInput,
    Notification,
    Modal,
    Table as MantineTable,
    Text,
    Group,
    NativeSelect,
    useMantineColorScheme, Tooltip
} from '@mantine/core';
import React, {EventHandler, KeyboardEvent, KeyboardEventHandler, useRef, useState} from 'react';
import {Table} from '@prisma/client';
import useSWR, {useSWRConfig} from 'swr';
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
import styles from "../styles/circle.module.css";
import {IconArmchair} from "@tabler/icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnUp} from "@fortawesome/free-solid-svg-icons";

const base = '/winterball';


export default function Tables({url, user, userTable}: { url: string, user: User, userTable: Table }) {


    const {data, mutate} = useSWR<{
        table: {
            locked: boolean,
            id: string,
            seatPositions: string[],
            members: { name: string, plusOnes: string[] }[]
        }
    }>(`/api/v1/table/${user.tableId}/seats`, fetcher, {refreshInterval: 3000});

    const [selectedUser, setSelectedUser] = useState(user.displayName);
    const [currentSeatPos, setCurrentSeatPos] = useState(0);


    const router = useRouter()

    if (!userTable) {
        return router.push('/tables');
    }


    const updateSeat = async () => {


        const newSeatPos = data?.table?.seatPositions;
        if (!newSeatPos) return;

        if (newSeatPos.find((name) => name === selectedUser)) {
            newSeatPos[newSeatPos.findIndex((name) => name === selectedUser)] = "";
        }

        newSeatPos[currentSeatPos] = selectedUser;

        const res = await fetch(`${base}/api/v1/table/${user.tableId}/seats`, {
            method: 'PATCH', headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },

            body: JSON.stringify(newSeatPos)
        });


        if (res.ok) {
            await mutate()
        }
    };

    const yourBgColour = 'dark' === 'dark' ? '#1e1e23' : '#e0e0e0'


    const rows = data?.table?.seatPositions?.map((m, i) => {
        return (
            <tr key={i} style={m === user.displayName ? {backgroundColor: yourBgColour} : {}}>
                <td>{`${i + 1}`}</td>
                <td>{`${m}`}</td>
            </tr>
        )

    });

    const getMembers = () => {
        const allMembers: string[] = [];

        if (!data?.table?.members) return allMembers;

        for (const m of data?.table?.members) {
            allMembers.push(m.name);

            if (m.plusOnes) {
                for (const p of m.plusOnes) {
                    allMembers.push(p);
                }
            }
        }

        return allMembers;
    }


    return (
        <>
            <div className='flex flex-col items-center justify-center w-full flex-1 px-5 text-center'>
                <h1 className="font-bold text-2xl m-2">Choose your seat</h1>
                <div className="flex flex-wrap flex-col">
                    <div className='flex flex-wrap flex-row items-end'>
                        <Link href="/tables" passHref>
                            <Button variant='outline' className='mx-5' component="a">
                                Back to all tables
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-wrap">
                    <div>
                        <div className="relative w-[500px] h-[500px]">
                            {
                                data?.table?.seatPositions?.map((name, i) => {

                                        if (i == currentSeatPos) {
                                            return (
                                                <div className={styles.circle} key={i}>
                                                    <div
                                                        className="h-11 w-11 border-4 border-green-600 rounded-md flex p-3 flex-row items-center justify-center m-2">
                                                        {i + 1}
                                                    </div>
                                                </div>
                                            )
                                        }

                                        if (name === "") {
                                            return (
                                                <div onClick={() => setCurrentSeatPos(i)} className={styles.circle} key={i}>
                                                    <div
                                                        className="cursor-pointer h-11 w-11 text-white max-w-300 bg-[#005C85] hover:bg-[#024460] rounded-md flex p-3 flex-row items-center justify-center m-2">
                                                        {/*<Tooltip label={seatPos[i]}>{i+1}</Tooltip>*/}
                                                        {i + 1}
                                                    </div>
                                                </div>
                                            )
                                        }


                                        return (
                                            <div className={styles.circle} key={i}>
                                                <div
                                                    className="h-11 w-11 border-4 border-red-600 rounded-md flex p-3 flex-row items-center justify-center m-2">
                                                    {i + 1}
                                                </div>
                                            </div>
                                        )
                                    }
                                )
                            }
                        </div>
                    </div>

                    <div>

                        <h2 className='font-bold text-xl m-2'>Your table</h2>

                        {/*<TableSeatCard key={userTable.id} overfull={realMemberCount > (10 - userCount)} userRank={data?.yourRank} url={url} {...userTable} />*/}

                        <Card className="m-5" withBorder radius="md" p="md">

                            <Card.Section className="p-4" mt="md">
                                <Text size="lg" weight={500}>
                                    Table
                                </Text>
                                <MantineTable>
                                    <thead>
                                    <tr>
                                        <th>Seat number</th>
                                        <th>Name</th>
                                    </tr>
                                    </thead>
                                    <tbody>{rows}</tbody>
                                </MantineTable>
                            </Card.Section>

                            <Group>


                                <NativeSelect
                                    // @ts-ignore
                                    data={getMembers()}
                                    label={`Select who should sit at seat ${currentSeatPos + 1}`}
                                    onChange={(event) => {
                                        setSelectedUser(event.currentTarget.value)
                                    }}
                                    value={selectedUser}
                                />

                                <Button className='mt-6' radius="md" onClick={updateSeat}>
                                    Confirm
                                </Button>


                            </Group>
                        </Card>

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

    const userTable = await prisma.table.findUnique({
        where: {
            id: user?.tableId || undefined,
        },
        include: {
            members: true,
        },
    });

    return {
        props: {
            url: process.env.NEXTAUTH_URL,
            user: JSON.parse(JSON.stringify(user)),
            userTable: JSON.parse(JSON.stringify(userTable)),
        },
    }
}

Tables.auth = true;
