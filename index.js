const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongodb = require('mongodb');

const port = process.env.PORT;

let player = {};

(async () => {

    // Connecting to MongoDB
    const connectionString = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.gmcli.mongodb.net/minesweeper?retryWrites=true&w=majority`;
    console.info('Conecting to MongoDB...');
    const client = await mongodb.MongoClient.connect(connectionString, { useUnifiedTopology: true });
    const players = client.db('minesweeper').collection('players');


    const app = express();
    app.use(bodyParser.json());
    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, 'client/build')));


    // AUxiliary functions:
    function getValidPlayers () { return players.find({}).toArray(); }

    function getPlayerByID (id) { return players.findOne({ _id: mongodb.ObjectId(id) }); }

    function sortMinesPositions (minesNumber, squaresNumber) {
        const minesPositions = Array(minesNumber);
        for (let i = 0; i < minesNumber; i++) {
            const index = Math.floor(Math.random() * squaresNumber);
            if (!minesPositions.includes(index)) minesPositions[i] = index;
            else i--;
        }
        return minesPositions;
    };

    async function verifyBody (verify, body) {

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

        if (verify.playerID) {
            if (body.playerID !== player.id) {
                try {
                    player = await getPlayerByID(body.playerID);
                    delete player._id;
                    player.id = body.playerID;
                } catch {
                    player = {game: null};
                }
            }
            if (!player.game) {
                player = {};
                return {status: 'failed', msg: `Player ${body.playerID} not found`};
            }
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
            if (body.index < 0 || body.index > player.game.rowsNumber * player.game.columnsNumber)
                return {status: 'failed', msg: `Index value higher than Game Board: ${body.index} > ${player.game.rowsNumber*player.game.columnsNumber}`};
        };

        if (verify.mines) {
            if (typeof(body.mines) !== "object")
                return {status: 'failed', msg: `Invalid type of mines positions: ${typeof(body.mines)}`};
            if (body.mines.length !== player.game.minesPositions.length)
                return {status: 'failed', msg: `Invalid number of mines: ${body.mines.length}`};
        };

        return null;
    }

    function countMines (index) {
        const { rowsNumber, columnsNumber, minesPositions } = player.game;
      
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











      

    // ==================== Initialize a Game ================================================ POST
    app.post('/api/start', async (req, res) => {

        // Validating Body
        const message = await verifyBody({minesNumber: true, level: true}, req.body);
        if (message) {
            res.send(message);
            return;
        };

        const { minesNumber, rowsNumber, columnsNumber, level } = req.body;
        // Sorting mines positions
        const minesPositions = sortMinesPositions(minesNumber, rowsNumber * columnsNumber);

        player.game = {
            level,
            minesPositions,
            rowsNumber,
            columnsNumber,
            isGameOver: false,
            roundsPlayed: [0, 0, 0],
            victories: [0, 0, 0],
            bestTime: [999, 999, 999]
        }

        const { insertedCount, insertedId } = await players.insertOne(player);

        // Validating creation
        if (insertedCount !== 1) {
            res.send({status: 'failed', msg: 'Error during the creation of the player!'});
            return;
        }

        player.id = '' + insertedId; // String
        // Returning player id
        res.send({ status: 'ok', msg: `Player ${player.id} created successfully`, playerID: player.id});
    });




    // ==================== Get All Players Info ========================================== GET ALL
    app.get('/api/data/:pass', async (req, res) => {
        if (req.params.pass === process.env.MASTER_PASSWORD)
            res.send({status: 'ok', msg: 'Returning all players', players: await getValidPlayers()});
        else
            res.send({status: 'failed', msg: 'Invalid Password'});
    });

    // ==================== Get Player Data =============================================== GET ONE
    app.get('/api/player/:id', async (req, res) => {
        try {
            const data =  await getPlayerByID(req.params.id);
            const {roundsPlayed, victories, bestTime} = data.game;
            res.send({status: 'ok', msg: `Returning player ${req.params.id} data`, roundsPlayed, victories, bestTime});
        } catch {
            res.send({status: 'failed', msg: `Invalid player ID: ${req.params.id}`});
        }
    });

    // ==================== Get Number of Mines Around ======================================== GET
    app.get('/api/mines/:id/:idx', async (req, res) => {
        const playerID = req.params.id;
        const index = +req.params.idx;
        
        // Validating Data
        const message = await verifyBody({playerID: true, index: true}, {playerID, index});
        if (message) {
            res.send(message);
            return;
        };

        const {mines, isMine} = countMines(index);
        
        if (player.game.isGameOver) {
            res.send({status: 'ok', msg: `Game Over`, mines, isMine});
            return;
        }

        if (isMine) {
            player.game.isGameOver = true;
            player.game.roundsPlayed[player.game.level] ++;
            await players.updateOne(
                { _id: mongodb.ObjectId(player.id) },
                { $set: {game: player.game} }
            );
        }

        res.send({status: 'ok', msg: `Opened square ${index}`, mines, isMine});
    });




    // ==================== Update Winning Stats ============================================== GET
    app.put('/api/win/:id', async (req, res) => {
        const body = req.body;
        body.playerID = req.params.id;
        
        // Validating Data
        const message = await verifyBody({playerID: true, mines: true, time: true}, body);
        if (message) {
            res.send(message);
            return;
        };

        const {mines, time} = body;

        if (player.game.isGameOver) {
            res.send({status: 'failed', msg: 'The Game is Over!'});
            return;
        }

        for (const mine of player.game.minesPositions) {
            if (!mines.includes(mine)) {
                res.send({status: 'failed', msg: 'To win the game, it is necessary to correctly inform all mines positions'});
                return;
            }
        };

        player.game.isGameOver = true;
        player.game.roundsPlayed[player.game.level] ++;
        player.game.victories[player.game.level] ++;
        if (time < player.game.bestTime[player.game.level]) player.game.bestTime[player.game.level] = time;
        await players.updateOne(
            { _id: mongodb.ObjectId(player.id) },
            { $set: {game: player.game} }
        );

        res.send({status: 'ok', msg: 'Player Wins'});
    });

    // ==================== Restart the Game ========================================================== PUT
    app.put('/api/restart/:id', async (req, res) => {
        const body = req.body;
        body.playerID = req.params.id;
        
        // Validating Body
        const message = await verifyBody({playerID: true, minesNumber: true, level: true}, body);
        if (message) {
            res.send(message);
            return;
        };

        const { minesNumber, rowsNumber, columnsNumber, level } = body;
        // Sorting mines positions
        const minesPositions = sortMinesPositions(minesNumber, rowsNumber * columnsNumber);

        player.game.level = level;
        player.game.minesPositions = minesPositions;
        player.game.rowsNumber = rowsNumber;
        player.game.columnsNumber = columnsNumber;
        player.game.isGameOver = false;

        await players.updateOne(
            { _id: mongodb.ObjectId(player.id) },
            { $set: {game: player.game} }
        );

        res.send({ status: 'ok', msg: `Player ${player.id} updated successfully`});
    });

    // ==================== Remove Player ================================================== DELETE
    app.delete('/api/remove/:id/:pass', async (req, res) => {

        // Validating id
        try {
            if (await players.countDocuments({ _id: mongodb.ObjectId(req.params.id) }) !== 1) {
                res.send({status: 'failed', msg: `Player ${req.params.id} not found`});
                return;
            };
        } catch {
            res.send({status: 'failed', msg: `Player ${req.params.id} not found`});
            return;
        }

        if (req.params.pass !== process.env.MASTER_PASSWORD) {
            res.send({status: 'failed', msg: 'Invalid Password'});
            return;
        }

        // Deleting
        const { deletedCount } = await players.deleteOne({ _id: mongodb.ObjectId(req.params.id) });

        // Validating deletion
        if (deletedCount !== 1) {
            res.send({status: 'failed', msg: 'Error during removal of the player!'});
            return;
        }

        res.send({status: 'ok', msg: `Player ${req.params.id} deleted`});

    });

    app.listen(port, () => {
        console.log(`App running on http://localhost:${port}`);
    });

})()