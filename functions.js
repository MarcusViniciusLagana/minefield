function sortMinesPositions (minesNumber, squaresNumber) {
    const minesPositions = Array(minesNumber);
    for (let i = 0; i < minesNumber; i++) {
        const index = Math.floor(Math.random() * squaresNumber);
        if (!minesPositions.includes(index)) minesPositions[i] = index;
        else i--;
    }
    return minesPositions;
};

function verifyBody (verify, body) {

    if (verify.rowsNumber || verify.columnsNumber || verify.minesNumber) {
        if (typeof(body.rowsNumber) !== "number")
            return {status: 'failed', msg: `Invalid type of the number of rows: ${typeof(body.rowsNumber)}`};
        if (body.rowsNumber <= 0)
            return {status: 'failed', msg: `Invalid number of rows: ${body.rowsNumber}`};
        if (typeof(body.columnsNumber) !== "number")
            return {status: 'failed', msg: `Invalid type of the number of columns: ${typeof(body.columnsNumber)}`};
        if (body.columnsNumber <= 0)
            return {status: 'failed', msg: `Invalid number of columns: ${body.columnsNumber}`};
        if (typeof(body.minesNumber) !== "number")
            return {status: 'failed', msg: `Invalid type of the number of mines: ${typeof(body.minesNumber)}`};
        if (body.minesNumber <= 0)
            return {status: 'failed', msg: `Invalid number of mines: ${body.minesNumber}`};
        if (body.minesNumber > body.rowsNumber * body.columnsNumber)
            return {status: 'failed', msg: `Invalid number of mines: ${body.minesNumber} > game-board (${body.rowsNumber * body.columnsNumber})`};
    };

    if (verify.level) {
        if (typeof(body.level) !== "number")
            return {status: 'failed', msg: `Invalid type of level: ${typeof(body.level)}`};
        if (body.level < 0 || body.level > 2)
            return {status: 'failed', msg: `Invalid level (< 0 or > 2): ${body.level}`};
    };

    if (verify.time) {
        if (typeof(body.time) !== "number")
            return {status: 'failed', msg: `Invalid type of time: ${typeof(body.time)}`};
        if (body.time < 0)
            return {status: 'failed', msg: `Invalid time: ${body.time} < 0`};
    };

    if (verify.index) {
        if (typeof(body.index) !== "number" || isNaN(body.index))
            return {status: 'failed', msg: `Invalid type of index: ${body.index} (${typeof(body.index)})`};
        if (!body.rowsNumber || !body.columnsNumber)
            return {status: 'failed', msg: 'Please inform number of rows and number of columns'};
        if (body.index < 0 || body.index > body.rowsNumber * body.columnsNumber)
            return {status: 'failed', msg: `Index value higher than Game Board: ${body.index} > ${body.rowsNumber*body.columnsNumber}`};
    };

    if (verify.mines) {
        if (typeof(body.mines) !== "object")
            return {status: 'failed', msg: `Invalid type of mines positions: ${typeof(body.mines)}`};
        if (!body.minesNumber)
            return {status: 'failed', msg: 'Please inform number of mines'};
        if (body.mines.length !== body.minesNumber)
            return {status: 'failed', msg: `Invalid number of mines: ${body.mines.length}`};
    };

    return null;
}

function countMines (index, rowsNumber, columnsNumber, minesPositions) {
  
    if (minesPositions.includes(index)) return({mines: 0, isMine: true});

    // index = row * columnsNumber + column
    // index/columnsNumber = row (quotient) + column/columnsNumber (remainder)
    const rowInit = Math.floor(index / columnsNumber);
    const columnInit = index % columnsNumber;
    let positions = [];
  
    for (let row = rowInit - 1; row < rowInit + 2; row++) {
        if (row < 0 || row > rowsNumber - 1) continue;
        for (let column = columnInit -1; column < columnInit + 2; column++) {
            if (row === rowInit && column === columnInit) continue;
            if (column < 0 || column > columnsNumber - 1) continue;
            positions.push(row * columnsNumber + column);
        }
    }
  
    // Count mines in adjacent squares
    let mines = 0;
    for (const position of positions) if (minesPositions.includes(position)) mines++;
  
    // return the number of mines and the valid positions around index
    return({mines, isMine: false});
}

module.exports = {sortMinesPositions, verifyBody, countMines};