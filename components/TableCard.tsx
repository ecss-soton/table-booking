import {IconArrowForward, IconLock, IconLockOpen, IconShare} from '@tabler/icons';
import {ActionIcon, Button, Card, CopyButton, Group, Table as MantineTable, Text, Tooltip, useMantineColorScheme} from '@mantine/core';
import {useState} from 'react';
import {useSWRConfig} from 'swr';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnUp} from "@fortawesome/free-solid-svg-icons";
import {Table, User} from "@prisma/client";
import Link from "next/link";

export function TableCard(table: Table & { userRank?: number, url: string, overfull: boolean }) {

    const { colorScheme } = useMantineColorScheme();

    const [lockButtonLoading, setLockButtonLoading] = useState(false);
    const [joinButtonLoading, setJoinButtonLoading] = useState(false);
    const [leaveButtonLoading, setLeaveButtonLoading] = useState(false);

    const {mutate} = useSWRConfig();

    const lockTable = async () => {
        setLockButtonLoading(true);

        const res = await fetch('/api/v1/lock', {
            method: 'post', headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },

            body: JSON.stringify({shouldLock: !table.locked})
        });

        if (res.ok) {
            await mutate('/api/v1/tables', (oldData: any) => {
                // Need to deep copy the data
                let data: {
                    yourTable?: string, yourRank?: number, tables: Table[]
                } | undefined = JSON.parse(JSON.stringify(oldData));
                if (data) {
                    let cachedTable = data.tables.find((t) => t.id === table.id);
                    if (cachedTable) {
                        cachedTable.locked = !table.locked;
                    }
                }
                return data;
            }, {populateCache: true, revalidate: false})
            setLockButtonLoading(false);
        }
    };

    const joinTable = async () => {
        setJoinButtonLoading(true);

        const res = await fetch('/api/v1/join', {
            method: 'post', headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },

            body: JSON.stringify({table: table.id})
        });

        if (res.ok) {
            await mutate('/api/v1/tables')
            setJoinButtonLoading(false);
        }
    };

    const leaveTable = async () => {
        setLeaveButtonLoading(true);

        const res = await fetch('/api/v1/leave', {
            method: 'post', headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },

            body: JSON.stringify({table: table.id})
        });

        if (res.ok) {
            await mutate('/api/v1/tables')
            setLeaveButtonLoading(false);
        }
    }

    const yourBgColour = colorScheme === 'dark' ? '#1e1e23' : '#e0e0e0'

    let memberCount = -1;
    // @ts-ignore
    const rows = table.members.map(m => {
        // TODO sort this by seat position
        return (<tr key={m.name} style={(memberCount += 1) === table.userRank ? {backgroundColor: yourBgColour } : {}}>
            <td className='flex flex-col'>{m.name}{
                // @ts-ignore
                m.plusOnes.map(name => {
                return <div className='flex' key={name}><IconArrowForward/>{name}</div>
            })}</td>

        </tr>);
    });

    return (
        <Card className="m-5" withBorder radius="md" p="md">

            <Card.Section className="p-4" mt="md">
                <Text size="lg" weight={500}>
                    Table
                </Text>
                <MantineTable>
                    <tbody>{rows}</tbody>
                </MantineTable>
            </Card.Section>

            <Group>
                <Button radius="md" disabled={table.locked || table.userRank !== undefined || table.overfull}
                        loading={joinButtonLoading} onClick={joinTable}>
                    Join Table
                </Button>
                {
                    (table.userRank !== undefined) &&
                    <>
                        <Button radius="md" loading={leaveButtonLoading} onClick={leaveTable}>
                            Leave Table
                        </Button>

                        <Link href="/seat-selection" passHref>
                            <Button variant='outline' component="a">
                                Choose Seat
                            </Button>
                        </Link>
                    </>
                }
                {table.locked && <CopyButton value={`${table.url}/tables?join=${table.id}`}>
                    {({copied, copy}) => (
                        <Tooltip label="Copied!" withArrow opened={copied}>
                            <ActionIcon variant={copied ? 'filled' : 'default'} radius="md" size={36} onClick={copy}
                                        color={copied ? 'teal' : 'dark'}>
                                <IconShare size={18} stroke={1.5}/>
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>}
                {
                    (table.userRank === 0) &&
                    <>
                        <ActionIcon variant="default" radius="md" size={36} loading={lockButtonLoading} onClick={lockTable}>
                            {table.locked ? <IconLock size={18} stroke={1.5}/> : <IconLockOpen size={18} stroke={1.5}/>}
                        </ActionIcon>

                    </>
                }
            </Group>
        </Card>
    );
}
