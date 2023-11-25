import {signIn, signOut, useSession} from "next-auth/react"
import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMicrosoft} from "@fortawesome/free-brands-svg-icons";
import {IconArmchair} from "@tabler/icons";

export const Seat: React.FC<{ seatNum: number, selected: boolean }> = ({ seatNum, selected }) => {

    const {data: session} = useSession();

    if (selected) {
        return (
            <>
                <div
                    className="h-11 max-w-300 border-4 border-green-600 rounded-md flex p-3 flex-row items-center justify-center m-2">
                    {seatNum}
                </div>
            </>
        )
    }

    return (
        <>
            <div className="cursor-pointer h-11 w-11 text-white max-w-300 bg-[#005C85] hover:bg-[#024460] rounded-md flex p-3 flex-row items-center justify-center m-2">
                {seatNum}
            </div>
        </>
    )
}