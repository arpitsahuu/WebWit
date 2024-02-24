const env = require("dotenv");
env.config({ path: "./.env" });
const express = require("express")
const app = express();
const cookieParser = require('cookie-parser');

// DataBase Conection
require('./models/database.js').connectDatabase();

// body parser
app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({ extended: false }));

//loger
const logger = require("morgan");
app.use(logger("dev"));

app.use(cookieParser());

//routed
app.get("/",(req,res) =>{
  res.send(
    "wellocm"
  )
})

app.use("/user", require("./routes/userRoutes.js"));


//error handling
const errorHandler = require("./utils/errorHandler");
const { generatedErrors } = require("./middlewares/error");
app.get("*", (req, res, next) => {
  next(new errorHandler(`request url not found ${req.url}`));
});
app.use(generatedErrors);


app.listen(process.env.PORT, () =>{
    console.log(`server is runing on port ${process.env.PORT}`)
})