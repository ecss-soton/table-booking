import {unstable_getServerSession} from "next-auth";
import {LoginButton} from "@/components/LoginButton";
import {IncomingMessage, ServerResponse} from "http";
import {NextApiRequestCookies} from "next/dist/server/api-utils";
import {NextApiRequest, NextApiResponse} from "next";
import {authOptions} from "./api/auth/[...nextauth]";
import {Text, useMantineColorScheme} from "@mantine/core";
import {signIn, signOut, useSession} from "next-auth/react";
import {useRouter} from "next/router";
import Tables from "./seat-selection";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMicrosoft} from "@fortawesome/free-brands-svg-icons";
import React from "react";

// @ts-ignore
export default function SignOut() {

    const router = useRouter();

    const {data: session} = useSession();

    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">

            <main className="flex flex-col items-center justify-center w-full flex-1 px-5 text-center">

                <div className='flex flex-row justify-center'>
                    {dark ? <img
                        className='max-h-72'
                        src={`/winterball/WinterBallGF_1.png`}
                        alt="ECSS Winter ball logo"
                    /> : <img
                        className='max-h-72'
                        src={`/winterball/WinterBallGF_1.png`}
                        alt="ECSS Winter ball logo"
                    />}

                </div>

                <div onClick={() => signOut()}
                     className="cursor-pointer h-11 w-64 text-white max-w-300 bg-[#005C85] hover:bg-[#024460] rounded-md flex p-3 flex-row items-center justify-center m-2">
                    <div className='flex-none pr-2'>
                        <FontAwesomeIcon icon={faMicrosoft} className='text-white text-lg h-4 w-5'/>
                    </div>
                    Sign out
                </div>

            </main>
        </div>
    );
}

export async function getServerSideProps(context: { req: (IncomingMessage & { cookies: NextApiRequestCookies; }) | NextApiRequest; res: ServerResponse | NextApiResponse<any>; }) {

    const session = await unstable_getServerSession(context.req, context.res, authOptions)

    if (!session) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false,
            },
        }
    }

    return {props: {}}
}

SignOut.auth = true;
