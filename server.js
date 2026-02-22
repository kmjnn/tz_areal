require('dotenv').config();
const express = require(express);
const {Pool} = require('pg');
const cors = require(cors);
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use (cors());
app.use(express.json());
app.use(express.static('public'));