const fs = require('fs');
const nReadlines = require('n-readlines');

//function getNumberOfLines(filePath) {
const getNumberOfLines = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const fileBuffer =  fs.readFileSync(filePath);
            split_lines = fileBuffer.toString().split("\n");
            return split_lines.length;
        } else return 0
    } catch(err) {
    console.error(err)
    }

}

const getRangeOfLines = (filePath, begin_line, end_line) => {

    const broadbandLines = new nReadlines(filePath);

    let line;
    let lineNumber = 1;
    let lines = []

    while (line = broadbandLines.next()) {
        if (lineNumber >= begin_line && lineNumber <= end_line) {
            lines.push(line.toString('utf8'))            
        }
        lineNumber++;
    }
    return lines
}

module.exports = { getNumberOfLines, getRangeOfLines };
