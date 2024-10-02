const express = require('express');
const cors = require('cors');

let app = express();
app.use(cors());

// add routes here
app.get('/', function(req,res){
    res.json({
       "message":"hello jen !"
    });
})

// app.get("/quote-of-the-day", function(req, res){
//     res.json({
//         "quote":"The early bird got to board the shuttle bus"
//     })
// })

// // the :name is a placeholder (i.e URL parameter)
// app.get("/hello/:firstName", function(req,res){
//     // we use req.params to access the placeholder
//     let name = req.params.firstName;
//     res.json({
//         "message":"Hello " + name
//     })
// })

// app.get("/addTwo/:number1/:number2", function(req,res){
//     let n1 = req.params.number1;
//     let n2 = req.params.number2;
//     // very important; all URL parameters are strings
//     let sum = Number(n1) + Number(n2);
//     res.json({
//         "message":"The sum is " + sum
//     })
// })

// app.get("/recipes", function(req, res){
//     console.log(req.query);
//     // extract from the query string
//     let cuisine = req.query.cuisine;
//     let time = req.query.time;
//     res.json({
//         "cuisine": cuisine,
//         "time": time
//     })
// })

app.get('/hello/:name', (req,res)=>{
    let name = req.params.name;
    res.send("Hi, " + name);
  })

  app.get('/echo', (req, res) => {
    // Get all query parameters
    const queryParams = req.query;

    // Create a response object
    const response = {
        message: "Here are the query parameters you sent:",
        firstName: queryParams.firstName,
        lastName: queryParams.lastName
    };

    // Send the response as JSON
    res.json(response);
});  

app.listen(5000, ()=>{
    console.log("Server started")
})
// npm install -g nodemon
// nodemon index.js