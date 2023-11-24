import {Session, unstable_getServerSession} from "next-auth";
import {authOptions} from "./api/auth/[...nextauth]";
import {IncomingMessage, ServerResponse} from "http";
import {NextApiRequest, NextApiResponse} from "next";
import {NextApiRequestCookies} from "next/dist/server/api-utils";
import {Team, User} from "@prisma/client";
import prisma from "../prisma/client";
import {Button, Text, useMantineColorScheme} from "@mantine/core";
import Link from "next/link";
import axios from "axios";
import {useRouter} from "next/router";

export default function Home({ session, user, url, team }: { session: Session, user: User, url: string, team: Team }) {

    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    return (
        <div>


            <main className="flex flex-col items-center justify-center w-screen flex-1 p-8 text-center">

                <div className='flex flex-row justify-center'>
                    {dark ? <img
                        className='max-h-72'
                        src="./WinterBallGF_1.png"
                        alt="Aleios ECSS hackathon logo"
                    /> : <img
                        className='max-h-72'
                        src="./WinterBallGF_1.png"
                        alt="Aleios ECSS hackathon logo"
                    />}

                </div>


                <div className="mt-12">
                    <Text>
                        Email society@ecs.soton.ac.uk if you have a complex seating requirement
                    </Text>

                    <div className='flex flex-row flex-wrap justify-center mt-5'>
                        <Link href="/teams" passHref>
                            <Button className='m-3' component="a">Choose table</Button>
                        </Link>
                    </div>

                </div>

                <div className='m-5'>
                    {!team && <p>You do not have a table yet and will be randomly assigned a seat</p>}
                    {(team && !team.timeslot) && <p>Book a slot</p>}
                    {(team && team.timeslot) && <p>Your slot is at {team.timeslot}</p>}
                </div>








            </main>
        </div>
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
        include: {
            team: true
        },
    });


    return {
        props: {
            session,
            user: JSON.parse(JSON.stringify(user)),
            url: process.env.NEXTAUTH_URL,
            team: JSON.parse(JSON.stringify(user?.team)) || false,
        },
    }
}