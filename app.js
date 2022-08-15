require('dotenv').config();
require('./config/db');
const express = require('express');
const cors = require('cors');
const employeeRouter = require('./routes/employee');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT;

app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        credentials: true,
        origin: 'https://muhamadaqmal13.github.io'
    })
);
app.use(`/api/teravin/`, employeeRouter);

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
