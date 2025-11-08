import prisma from "./client";
import {writeFileSync} from "fs";

(async () => {

    const allTables: string[][] = []

    const tables = await prisma.table.findMany();

    for (const table of tables) {
        // Gets all the members of the table
        const members = await prisma.user.findMany({
            where: {
                tableId: table.id
            }
        })

        // Find the complete membership of the table, including plus ones
        const tableMembersIncPlusOnes: string[] = []
        members.forEach((member) => {
            tableMembersIncPlusOnes.push(member.displayName)
            tableMembersIncPlusOnes.push(...member.plusOnes)
        })

        // For each member of the table, if they are not in the seating plan, find the first empty seat and put them there
        tableMembersIncPlusOnes.forEach((member) => {
            if (!table.seatPositions.includes(member)) {
                const i = table.seatPositions.findIndex((elem) => elem === '')
                table.seatPositions[i] = member + " (unassigned)"
            }
        })

        allTables.push(table.seatPositions)

    }


    // Write the allTables object to a JSON file
    writeFileSync('./seatingPlan.json', JSON.stringify(allTables, null, 4))

    // Write the allTables object to a CSV file
    let csv = "Name of Guest,Alley number\n"
    allTables.forEach((table, tableNo) => csv += table.map((elem) => `${elem},${tableNo+1}`).join('\n') + '\n')
    writeFileSync('./seatingPlan.csv', csv)

})()

