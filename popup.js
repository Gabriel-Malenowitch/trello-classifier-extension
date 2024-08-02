document.getElementById('my-button').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: start
        });
    });
});


const start = () => {
    // rows: string[][]
    const downloadCsv = rows => {
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "Trello classifier.csv")
        // document.body.appendChild(link) // Required for FF

        link.click()
    }

    const sanitize = str => String(str).replace(/,|;/g, '-')

    const scrap = () => {
        const board = document.getElementById('board')
        const columns = Array.from(board.childNodes)
        
        const parsedColumns = columns.map(column => {
            const name = column.querySelector('[data-testid="list-name"]')?.innerHTML
            if(!name) {
                return false
            }

            const items = Array.from(
                column.querySelector('[data-testid="list-cards"]')?.childNodes
            ).map(element => 
                element.querySelector('[data-testid="card-name"]')?.innerHTML
            )
    
            // Make json as second group and name as first
            const regexConfig = /\[(.+)\]\[config: (\{.*\})\]/
    
            // Example: [teste n sei oq][config: {"test": 123, "test2":321}]
            const itemsConfigs = items.map(
                item => {
                    const config = JSON.parse(item.match(regexConfig)?.[2] ?? '{}')
                    return {
                        name: item.match(regexConfig)?.[1],
                        ...config
                    }
                }
            )
            
            return {
                name,
                items: itemsConfigs
            }
        }).filter(Boolean)

        return parsedColumns
    }
    const getStatistics = (csvData, index) => {
        const EMPTY = ["","", ""]
        const MISSING = [
            "Redação",
            'Matemática',
            'Química',
            'Física',
            'Biologia',
            'Sociologia',
            'História',
            'Filosofia',
            'Geografia',
            'Literatura',
            'Português- gramática e língua estrangeira',
        ]
        if(index >= MISSING.length) {
            return EMPTY
        }

        const notDoneLength = csvData.filter(row => row[0] !== "done" && row[1] === MISSING[index]).length
        const doneLength = csvData.filter(row => row[0] === "done" && row[1] === MISSING[index]).length
        return [MISSING[index], notDoneLength, doneLength]

    }

    const parsedColumns = scrap()
    console.log(parsedColumns)


    let csvContent = parsedColumns.map(column => 
        column.items.map(item => 
            [
                sanitize(column.name), 
                sanitize(item.materia),
                sanitize(item.name),
            ]
        )).flat()

    csvContent = csvContent.map((content, index) => [...content, ...getStatistics(csvContent, index)])

    // Column, "materia", Task name, Not done "materia", "Not done length"
    downloadCsv(csvContent)
}
