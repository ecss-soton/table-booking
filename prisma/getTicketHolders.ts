import prisma from "./client";
import {createReadStream} from 'fs'
import {parse} from 'csv-parse'

(async () => {
    let ticketHolders: {[key: string]: {name: string, sotonId: string, plusOneName?: string}} = {};

    createReadStream("./doorlist.csv")
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", (row) => {
            const name = row[0];
            const buyerName = row[10];
            const sotonId = row[11].split('@')[0]

            if (row[11].split('@')[1] !== 'soton.ac.uk') {
                console.error(`Found non soton.ac.uk email address: ${row[11]}`);
            }

            if (buyerName !== name) {
                ticketHolders[sotonId] = {
                    sotonId,
                    name: buyerName,
                    plusOneName: name
                }
            } else if (!ticketHolders[sotonId]) {
                ticketHolders[sotonId] = {
                    sotonId,
                    name: buyerName,
                }
            }
        })
        .on("end", async () => {
            await prisma.ticketHolders.deleteMany()
            await prisma.ticketHolders.createMany({
                data: Object.values(ticketHolders)
            })
        })
})()
