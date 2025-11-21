import {unstable_getServerSession} from "next-auth";
import {LoginButton} from "@/components/LoginButton";
import {IncomingMessage, ServerResponse} from "http";
import {NextApiRequestCookies} from "next/dist/server/api-utils";
import {NextApiRequest, NextApiResponse} from "next";
import {authOptions} from "./api/auth/[...nextauth]";
import {Text, useMantineColorScheme} from "@mantine/core";
import {useSession} from "next-auth/react";
import {useRouter} from "next/router";

// @ts-ignore
export default function SignIn() {

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
                        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/WinterBallGF_1.png`}
                        alt="ECSS Winter ball logo"
                    /> : <img
                        className='max-h-72'
                        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/WinterBallGF_1.png`}
                        alt="ECSS Winter ball logo"
                    />}

                </div>

                <h1 className="font-bold text-4xl mt-10">ECSS Winter Ball table selection</h1>

                <Text className='my-5'>
                    Login with your university account to select a table so you can sit with your friends!
                </Text>

                <LoginButton/>

            </main>
        </div>
    );
}

export async function getServerSideProps(context: { req: (IncomingMessage & { cookies: NextApiRequestCookies; }) | NextApiRequest; res: ServerResponse | NextApiResponse<any>; }) {

    const session = await unstable_getServerSession(context.req, context.res, authOptions)

    if (session) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return {props: {}}
}
