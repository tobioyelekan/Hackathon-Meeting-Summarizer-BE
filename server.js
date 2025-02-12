const express = require('express');
const bodyParser = require('body-parser')
const multer = require('multer');


const app = express();

//NOTE - SETTING UP MIDDLEWARE

app.use(express.urlencoded({extended: true}))
