import prisma from "./client";
import {createReadStream} from 'fs'
import {parse} from 'csv-parse'
import {number} from "prop-types";

(async () => {
    let ticketHolders: {[key: string]: {name: string, sotonId: string, plusOnes: string[]}} = {};
    let timesSeen: {[key: string]: number} = {}

    console.log('Starting ticket holder import...');

    createReadStream("./doorlist.csv")
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", (row) => {
            if (row[7].includes("Menu")){
                console.log('Processing row:', row);
                const name = row[1];
                const buyerName = row[1];
                const sotonId = row[2].split('@')[0];
                const qty = parseInt(row[3]);

                if (row[1].split('@')[1] !== 'soton.ac.uk') {
                    console.error(`Found non soton.ac.uk email address: ${row[2]}`);
                }
                
                timesSeen[sotonId] = (timesSeen[sotonId] ?? 0) + qty;
                ticketHolders[sotonId] = {sotonId, name: name, plusOnes: ticketHolders[sotonId]?.plusOnes ?? []}

                if (timesSeen[sotonId] > 1) {
                    ticketHolders[sotonId].plusOnes.push(name)
                }
        }})
        .on("end", async () => {
            console.log('CSV parsing complete. Total ticket holders found:', Object.keys(ticketHolders).length);
            console.log('Ticket holders data:', JSON.stringify(ticketHolders, null, 2));
            
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
            console.log('Deleted existing ticket holders');
            
            const result = await prisma.ticketHolders.createMany({
                data: Object.values(ticketHolders)
            })
            console.log('Created ticket holders:', result.count);
            console.log('Ticket holder import complete!');
        })
        .on("error", (err) => {
            console.error('Error reading CSV file:', err);
        })
})()
