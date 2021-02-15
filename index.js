const express = require('express');

const port = 5000;

const app = express();

app.get('', async (req, res) => {
    res.send({msg: 'Hello World'});
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});