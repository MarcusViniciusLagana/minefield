# Minesweeper

Minesweeper was one of the first PC games I played. When I was a child, in the '90s, I remember going to the supermarket, stopping at the computer sector and asking for the password so I could play the games that came installed on Windows while my parents went shopping. When I finally got my first Windows 95 PC I mainly played demo versions and the free games that came with the computer, like solitaire, pinball and minesweeper. The latter stick with me for a few years, whenever I needed to wait midnight to connect to the internet or download a 7 MB file using dial-up, there I was playing minesweeper.

The game is pretty straightforward: there is a field with several hidden mines and you must find them by opening all squares that do not have one. As a clue, when opened, each square that does not have a mine will show the number of mines in the 8 squares around it. If you are good at math and learn to identify some patterns in the squares, you will win the game easily, at least in the early levels.

## Introduction

This project was developed using React JS, Express and MongoDB with the objective of practicing and assimilating knowledge acquired in the frontend and backend courses from Sansumg Ocean, given by professor [Paulo Salvatore](https://github.com/paulosalvatore) on December 2020. The following content will describe the project and how to reproduce and expand it yourself, so that knowledge can be disseminated. I believe that, after teaching, doing is the best way to learn something.

## Description

## Backend

We will start by creating a backend RESTFul API using Express.

1. Create a new folder for your project, open the terminal in that folder and type `npm init`
2. Follow the intructions to create the a _package.json_ file. You ca always edit it latter and change its content.
3. Install express: `npm install express`
4. Install nodemon as a development dependency: `npm install nodemon -D`
5. Create a new file: _index.js_
6. Open the _package.json_ file and insert a dev script as shown below:
```
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "dev": "nodemon index"
  },
```