import prisma from "./client";
import {createReadStream} from 'fs'
import {parse} from 'csv-parse'
import {number} from "prop-types";

(async () => {
    let ticketHolders: {[key: string]: {name: string, sotonId: string, plusOnes: string[]}} = {};
    let timesSeen: {[key: string]: number} = {}

    createReadStream("./doorlist.csv")
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", (row) => {
            const name = row[0];
            const buyerName = row[10];
            const sotonId = row[11].split('@')[0]

            if (row[11].split('@')[1] !== 'soton.ac.uk') {
                console.error(`Found non soton.ac.uk email address: ${row[11]}`);
            }

            timesSeen[sotonId] = (timesSeen[sotonId] ?? 0) + 1;
            ticketHolders[sotonId] = {sotonId, name: buyerName, plusOnes: ticketHolders[sotonId]?.plusOnes ?? []}

            if (buyerName !== name) {
                ticketHolders[sotonId].plusOnes.push(name)
            }
        })
        .on("end", async () => {
            for (const sotonId in ticketHolders) {
                if ((ticketHolders[sotonId].plusOnes.length + 1) !== timesSeen[sotonId]) {
                    console.error(`Incorrectly attributed ${JSON.stringify(ticketHolders[sotonId])} as a plus one.`);

                    if (timesSeen[sotonId] !== 1) {
                        throw new Error(`Unable to auto-fix. ${JSON.stringify(ticketHolders[sotonId])} as seen ${timesSeen[sotonId]} times.`);
                    }

                    ticketHolders[sotonId].plusOnes = [];

                }
            }

            await prisma.ticketHolders.deleteMany()
            await prisma.ticketHolders.createMany({
                data: Object.values(ticketHolders)
            })
        })
})()
