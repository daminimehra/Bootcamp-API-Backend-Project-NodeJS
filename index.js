const path = require('path');
const dotenv = require('dotenv');
const cors = require("cors")
const express = require("express");
const connectDB = require("./backend/config/db");
const app = express();
const fileupload = require('express-fileupload');
const cookieParser = require("cookie-parser");
const errorHandler = require('./backend/middleware/error');



// Route files
const bootcamps = require("./backend/routes/bootcamp")
const auth = require('./backend/routes/auth');
const courses = require('./backend/routes/courses');
const users = require('./backend/routes/users');


// Connect to database
connectDB();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// File uploading
app.use(fileupload());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.get("/home", (req,res)=>{
    res.json({
        message:"Home page"
    })
})

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);


app.use(errorHandler);



app.listen(process.env.PORT ||3001);