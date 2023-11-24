import {IconLock, IconLockOpen, IconShare} from '@tabler/icons';
import {ActionIcon, Button, Card, CopyButton, Group, Table, Text, Tooltip, useMantineColorScheme} from '@mantine/core';
import {useState} from 'react';
import {useSWRConfig} from 'swr';

export function TableCard(table: TableType & { userRank?: number, url: string }) {

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
                    yourTable?: string, yourRank?: number, tables: TableType[]
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
    const rows = table.members.map(m => {
        return (<tr key={m.name} style={(memberCount += 1) === table.userRank ? {backgroundColor: yourBgColour } : {}}>
            <td>{m.name}</td>
        </tr>);
    });

    return (
        <Card className="m-5" withBorder radius="md" p="md">

            <Card.Section className="p-4" mt="md">
                <Text size="lg" weight={500}>
                    Members
                </Text>
                <Table>
                    <thead>
                    <tr>
                        <th>Name</th>
                    </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </Table>
            </Card.Section>

            <Group mt="xs">
                <Button radius="md" disabled={table.locked || table.userRank !== undefined || table.members.length >= 4}
                        loading={joinButtonLoading} onClick={joinTable}>
                    Join Table
                </Button>
                {
                    (table.userRank !== undefined) &&
                    <Button radius="md" loading={leaveButtonLoading} onClick={leaveTable}>
                        Leave Table
                    </Button>
                }
                {
                    (table.userRank === 0) &&
                    <>
                        <ActionIcon variant="default" radius="md" size={36} loading={lockButtonLoading} onClick={lockTable}>
                            {table.locked ? <IconLock size={18} stroke={1.5}/> : <IconLockOpen size={18} stroke={1.5}/>}
                        </ActionIcon>
                        <CopyButton value={`${table.url}tables?join=${table.id}`}>
                            {({ copied, copy }) => (
                                <Tooltip label="Copied!" withArrow opened={copied}>
                                    <ActionIcon variant={copied ? 'filled' : 'default'} radius="md" size={36} onClick={copy} color={copied ? 'teal' : 'dark'}>
                                        <IconShare size={18} stroke={1.5}/>
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </CopyButton>
                    </>
                }
            </Group>
        </Card>
    );
}