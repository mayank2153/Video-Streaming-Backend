## gitkeep
  we create the .gitkeep(public/temp) file to get the files tracked by git

## Connecting DB
  - To connect the db, we had first created a cluster on mongodb and installed express, mongoose and dotenv in our project.
  - we have made a mongodb connection function inside index.js in db folder which will be used to connect to the database.
  - we will call this function in the entry point of our app i.e. index.js in src folder
  - the connection function of the mongodb is an async function.

## Using Dotenv
  - To have dotenv in our project , we need to call it by using require but we have used import to call it, thats why we have added -r flag in our dev script to make our app know that it should have to call dotenv/config in starting and we have also added --experimental-json-modules in our dev script to call dotenv/ by import 

## Middleware
 - Middlewares are the checks performed by the app in the middle of a request, suppose that the user want to go to ``` /twitter and we have app.get('/twitter,(req,res)=>{res.send("hello")}).```  
 - If a middleware is available then the app dont show show "Hello" on the screen but it will check that the middleware is passed or not.
 - For example we can add a middleware to check that user is logged in or not before going to `/twitter`


To load the middleware function, call app.use(), specifying the middleware function. For example, the following code loads the myLogger middleware function before the route to the root path (/).

const express = require('express')
const app = express()

const myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}

app.use(myLogger)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000)
Every time the app receives a request, it prints the message “LOGGED” to the terminal.


we have created our own ApiError class by inheriting the properties of  the OG error class.
we can create our own error class for errors of different kinds like here we have created ApiError. the generall convention of writing class is like this


class <Name> extends Error{
    constructor(){
        super(message);
    }
}

by using super, we are inheriritng properties of  the error class we have initialized some properties of our own, and if the stack trace of the error is not provided on our constructor then we are creating our stackTace using Errror.captureStackTrace.
Stack trace is the The functions or methods that were called leading up to the error.
and File names and line numbers where each function or method is defined.

13/04/24
today we will create data models for our app, by refering to thid : https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj

firstly we are creating user and video models for our app in models folder.
after creating the basic fields. we have installed some libraries:
    1. mongoose aggregate paginate v2: the work of this library is that it use to retrieve selected data from the database in a paginated manner(we will learn about it later on)

    2. bcrypt: this library is used to securely hash passwords and make them encrypted

    3. json web token: JWTs provide a flexible and efficient way to securely transmit information between parties, making them a popular choice for authentication and authorization in web development.

we have installed mongoose aggregate paginate in video model through a plugin.
we have made a function in user model that beforer saving the data the function will always hash the password if it is modified.
and we have also made a function to check that if a password is correct or not.

what are access and referesh tokens?
    Access tokens are temporary credentials that grant access to a protected resource, while refresh tokens are used to obtain new access tokens once the current ones expire.
    we have made our access token and refresh token in .env file.

## Multer
  - Multer stores uploaded files on the local server's disk or in memory.

## Cloudinary
 - Cloudinary stores uploaded files on their servers

