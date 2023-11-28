import prisma from "./client";
import {readFileSync, writeFileSync} from "fs";

(async () => {

    const seatingPlan = await getJsonTables();

    // Write the allTables object to a JSON file
    writeFileSync('./seatingPlan.json', JSON.stringify(seatingPlan, null, 4))



    const tt = getTTData();

    // Write the allTables object to a CSV file
    let csv = "Name of Guest,Table,Carrot Soup,Chicken Terrine,Goat Cheese Salad,Turkey,Hake,Squash Wellington,Sticky Toffee Pudding,Cheesecke,Dietary Requirements i.e. Vegan\n"
    seatingPlan.forEach((table, tableNo) => {
        table.forEach((displayName) => {
            if (displayName === '') {
                csv+=`,${tableNo + 1},,,,,,,,,\n`
                return;
            }

            const ttData = findTTEntry(tt, displayName)

            tt[ttData[0].split("\"").join("")].push("seated");

            csv += `${ttData[0]},${tableNo + 1},${getFoodOrder(ttData)},${ttData[6]}\n`
        })
    })

    for (const [_, value] of Object.entries(tt)) {

        if (value[value.length - 1] === "seated") continue

        csv += `${value[0]},No table,${getFoodOrder(value)},${value[6]}\n`
    }

    writeFileSync('./seatingPlan.csv', csv)

})()

function getTTData() {
    const doorlist = readFileSync('./doorlist.csv', 'utf-8').split('\n')
    doorlist.shift()


    const tt: { [key: string]: string[] } = {}
    doorlist.forEach((elem) => {
        const name = elem.split(',')[0].split('\"').join('')
        // parse the csv line into an array, taking into account commas in various fields
        tt[name] = elem.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    })

    return tt
}

async function getJsonTables(): Promise<string[][]> {
    const tables = await prisma.table.findMany();
    const allTables: string[][] = []

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

    return allTables;
}

function findTTEntry(tt: { [key: string]: string[] }, uniFullName: string) {
    const uniName = uniFullName.split("(")[0].trim()
    let ttData = tt[uniName];

    if (!ttData) {
        const emailAddr = uniFullName.split("(")[1].split(")").join("").trim() + "@soton.ac.uk";
        Object.values(tt).forEach((elem) => {
            if (elem[11] === emailAddr) {
                ttData = elem;
            }
        })
    }

    return ttData;
}

function getFoodOrder(ttData: string[]) {
    // Starter
    let carrotSoup = ttData[7] === "\"Winter Carrot & Squash Soup (VG,GF)\"" ? '1' : '';
    let chickenTerrine = ttData[7] === "\"Pressed Chicken & Apricot Terrine (Spiced fruit chutney & focaccia bread)\"" ? '1' : '';
    let goatCheese = ttData[7] === "\"Goat Cheese & Bulgur Wheat Salad w/ Olive oil, mint & lemon (VE)\"" ? '1' : '';

    // Main
    let turkey = ttData[8] === "\"Roast Turkey Breast, Sage and Onion Stuffing Chipolata Wrapped in Bacon w/ Roast Gravy\"" ? '1' : '';
    let hake = ttData[8] === "\"Baked Hake Fillet (GF)\"" ? '1' : ''
    let squash = ttData[8] === "\"Parmesan & Herb Crumb, white wine cream Butternet Squash & Spinach Wellington w/ Rustic Tomato Sauce(VE)\"" ? '1' : '';

    // Desert
    let stickyPudding = ttData[9] === "\"Sticky Toffee Christmas Pudding w/ Brandy Custard\"" ? '1' : ''
    let cheesecake = ttData[9] === "\"New York Baked Vanilla Cheesecake w/ Mulled Berries (VG, GF)\"" ? '1' : '';

    return `${carrotSoup},${chickenTerrine},${goatCheese},${turkey},${hake},${squash},${stickyPudding},${cheesecake}`;
}


