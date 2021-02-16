const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongodb = require('mongodb');
const { sortMinesPositions, verifyBody, countMines } = require('./functions')

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


    function getValidPlayers () { return players.find({}).toArray(); };

    async function loadPlayer(id) {
        if (id !== player.id) {
            try {
                player = await players.findOne({ _id: mongodb.ObjectId(id) });
                delete player._id;
                player.id = id;
                return null;
            } catch {
                player = {};
                return {status: 'failed', msg: `Player ${id} not found`};
            }
        }
    }


    // ==================== Initialize a Game ================================================ POST
    app.post('/api/start', async (req, res) => {

        // Validating Body
        const message = verifyBody({minesNumber: true, level: true}, req.body);
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
            gamesPlayed: [0, 0, 0],
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

        // Validating Player ID
        const message = await loadPlayer(req.params.id);
        if (message) {
            res.send(message);
            return;
        };
        
        const {gamesPlayed, victories, bestTime} = player.game;
        res.send({status: 'ok', msg: `Returning player ${req.params.id} data`, gamesPlayed, victories, bestTime});
    });

    // ==================== Get Number of Mines Around ======================================== GET
    app.get('/api/mines/:id/:idx', async (req, res) => {
        
        // Validating Player ID
        let message = await loadPlayer(req.params.id);
        if (message) {
            res.send(message);
            return;
        };

        const index = +req.params.idx;
        const {rowsNumber, columnsNumber, minesPositions} = player.game;
        
        // Validating Data
        message = verifyBody({index: true}, {index, rowsNumber, columnsNumber});
        if (message) {
            res.send(message);
            return;
        };

        const {mines, isMine} = countMines(index, rowsNumber, columnsNumber, minesPositions);
        
        if (player.game.isGameOver) {
            res.send({status: 'ok', msg: `Game Over`, mines, isMine});
            return;
        }

        if (isMine) {
            player.game.isGameOver = true;
            player.game.gamesPlayed[player.game.level] ++;
            await players.updateOne(
                { _id: mongodb.ObjectId(player.id) },
                { $set: {game: player.game} }
            );
        }

        res.send({status: 'ok', msg: `Opened square ${index}`, mines, isMine});
    });


    // ==================== Update Winning Status ============================================= GET
    app.put('/api/win/:id', async (req, res) => {
        
        // Validating Player ID
        let message = await loadPlayer(req.params.id);
        if (message) {
            res.send(message);
            return;
        };

        const {mines, time} = req.body;
        const minesNumber = player.game.minesPositions.length;
        
        // Validating Data
        message = verifyBody({mines: true, time: true}, {mines, minesNumber, time});
        if (message) {
            res.send(message);
            return;
        };

        if (player.game.isGameOver) {
            res.send({status: 'failed', msg: 'The Game is Over!'});
            return;
        }

        for (const mine of player.game.minesPositions) {
            if (!mines.includes(mine)) {
                player.game.isGameOver = true;
                player.game.gamesPlayed[player.game.level] ++;
                await players.updateOne(
                    { _id: mongodb.ObjectId(player.id) },
                    { $set: {game: player.game} }
                );
                res.send({status: 'ok', msg: 'Game finished, player lost!'});
                return;
            }
        };

        player.game.isGameOver = true;
        player.game.gamesPlayed[player.game.level] ++;
        player.game.victories[player.game.level] ++;
        if (time < player.game.bestTime[player.game.level]) player.game.bestTime[player.game.level] = time;
        await players.updateOne(
            { _id: mongodb.ObjectId(player.id) },
            { $set: {game: player.game} }
        );

        res.send({status: 'ok', msg: 'Game finished, player wins!'});
    });

    // ==================== Restart the Game ========================================================== PUT
    app.put('/api/restart/:id', async (req, res) => {
        
        // Validating Player ID
        let message = await loadPlayer(req.params.id);
        if (message) {
            res.send(message);
            return;
        };
        
        // Validating Body
        message = verifyBody({minesNumber: true, level: true}, req.body);
        if (message) {
            res.send(message);
            return;
        };

        const { minesNumber, rowsNumber, columnsNumber, level } = req.body;

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

        // Validating Player ID
        const message = await loadPlayer(req.params.id);
        if (message) {
            res.send(message);
            return;
        };

        if (req.params.pass !== process.env.MASTER_PASSWORD) {
            res.send({status: 'failed', msg: 'Invalid Password'});
            return;
        }

        // Deleting
        const { deletedCount } = await players.deleteOne({ _id: mongodb.ObjectId(req.params.id) });

        // Validating Removal
        if (deletedCount !== 1) {
            res.send({status: 'failed', msg: 'Error during removal of the player!'});
            return;
        }

        res.send({status: 'ok', msg: `Player ${req.params.id} deleted`});
    });


    // "Catchall" handler: for any request that doesn't match
    // the ones above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname+'/client/build/index.html'));
    });
    

    app.listen(process.env.PORT, () => {
        console.log(`App running on http://localhost:${process.env.PORT}`);
    });

})()