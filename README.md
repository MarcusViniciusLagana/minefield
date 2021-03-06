# Minesweeper

Minesweeper was one of the first PC games I played. When I was a child, in the '90s, I remember going to the supermarket, stopping at the computer sector and asking for the password so I could play the games that came installed on Windows while my parents went shopping. When I finally got my first Windows 95 PC I mainly played demo versions and the free games that came with the computer, like solitaire, pinball and minesweeper. The latter stick with me for a few years, whenever I needed to wait midnight to connect to the internet or download a 7 MB file using dial-up, there I was playing minesweeper.

The game is pretty straightforward: there is a field with several hidden mines and you must find them by opening all squares that do not have one. As a clue, when opened, each square that does not have a mine will show the number of mines in the 8 squares around it. If you are good at math and learn to identify some patterns in the squares, you will win the game easily, at least in the early levels.

## Introduction

This project was developed using React JS, Express and MongoDB with the objective of practicing and assimilating knowledge acquired in the frontend and backend courses from Sansumg Ocean, given by professor [Paulo Salvatore](https://github.com/paulosalvatore) on December 2020. The following content will describe the project, the technical choices and some options for future implementations, feel free to reach me with your feedbacks or questions at marcus.lagana@gmail.com

## Description

The application was divided into a front and a back-end, which exchange data according to the following diagram:

<p align="center">
  <img width="1000" alt="Project Diagram" src="project-diagram.png">
</p>

The game does not need a backend to work on its on, but this part of the project was made to train the creation of such component in a web development context.

## Backend

The backend is a RESTful API built using Express, connected to a MongoDB database, which main goal is to store the mines positions and the player statistics (number of victories, number of games played and best times). It was designed to prevent cheating (like accessing mine positions without playing).

##After the development and tests of the API, a catchall endpoint was created to redirect any request to the frontend part of the application. This way, both parts could be hosted together.##

### Endpoints

Each request to the websites API is expected to occur at `website/api/endpoint`

#### Start /api/start

This endpoint expects a POST request with the game's configuration in its body (height and width of the board, number os mines and difficulty level) and is used to create a new player and start a new game.

Internally, it randomly selects mine positions and stores all the necessary information in the database, including zeroed statistics, returning the id to the frontend. The responsability of using the same id for each player is assigned to the frontend.

#### Get All Players Data /api/data/password

This endpoint is expected to be used only by the application designer to look through all players data and is the only one that send mine positions outside of the backend. It expects a GET request with a password that must match an enviroment variable to return any useful information.

#### Get Player Data /api/player/id

It expects a GET request with the player's id and is used to return that player's statistics (games played, victories and best times for each difficulty level).

#### Get Number of Mines Around /api/mines/id/index

This endpoint expects a GET request with the player's id and a board square index (the one that is being clicked by the player). It is the most important endpoint of the game because it is used to reveal the board.

It returns if there is a mine in the board's square index and how many mines are around that square. To prevent cheating, whenever there is a mine in that index, it flags the game as finished and updates the player's statistics, adding a defeat.

Even after the game is over, it continues to return if there is a mine in the requested index and how many mines are around it, but the player's statistics can no longer be updated.

#### Update Winning Status /api/win/id

It expects a PUT request with the player's id and the mine positions and the spent time in its body. Internally, it verifies that the provided mine positions match the ones stored in the backend, flags the game as finished and updates the player's statistics, adding a victory. After the game is over, it stops updating the statistics.

To prevent cheating, whenever this endpoint is used with a valid player id, mine positions and spent time, it flags the game as finished. If the mine positions did not match the ones stored in the backend, a player defeat is added to the statistics.

#### Restarting the Game /api/restart/id

This endpoint expects a PUT request with the player's id and the game's configuration in its body (height and width of the board, number os mines and difficulty level) and is used to restart the game from a stored player.

It randomly selects new mine positions, updates the board size and level, and reset the game state (game is not over) updating all this information in the database.

#### Removing a Player /api/remove/id/password

This endpoint is expected to be used only by the application designer to remove data from the database. It expects a DELETE request with the player's id to be deleted and the password that must match the enviroment variable.


### Configuring the environment
1. Create a new folder for the project, open the terminal in that folder and type **`npm init`**.
2. Follow the intructions to create the ***package.json*** file. You can always edit it latter and change its content.
3. Install **express**, wich will be used to create the API: **`npm install express`**
4. Install **nodemon** as a development dependency, which will be used to restart the development server whenever any project file is updated and saved: **`npm install nodemon -D`**
5. Open the ***package.json*** file and insert a development script as shown below (don't forget to add a comma at the end of the test script line):
```json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "nodemon index"
  },
```
6. Create a new file: ***index.js***
7. Fill ***index.js*** with the following minimal code:
```js
const express = require('express');

const port = 5000;

const app = express();

app.get('', async (req, res) => {
    res.send({msg: 'Hello World'});
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
```
8. Run the server by typing **`npm run dev`** in the terminal and access the API at (http://localhost:5000). `{"msg": "Hello World"}` shall be displayed.

**Summary**
On steps 1 and 2, **node** was installed and the file ***package.json*** of the project was created, which is responsible for configuring **node** and managing all installed packages. Then **express** and **nodemon** were installed, **express** being the package used to create the API and **nodemon** the one that will restart our server with every file change during the development. On step 5 the development script (used to run the server) was created, and then the first javascript file was created and the server was started and tested.

For now, the app

### Creating the endpoints
