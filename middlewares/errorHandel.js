const mongoose = require("mongoose");
const AppError = require("../utils/AppError");



module.exports = (err, req, res, next) => {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev && err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            isOperational: err.isOperational,
            stack: err.stack,
        })
    }

    if(err instanceof AppError){
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    }

    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
        return res.status(400).json({
            status: "Failed",
            message: `Duplicate entry ${Object.keys(err.keyValue)[0]}`
        })
    }

    if(err.name === "ValidationError"){
        return res.status(400).json({
            status: "Failed",
            message: err.message,
        })
    }


    if (err.name === "CastError") {
        return res.status(400).json({
            status: "Failed",
            message: `Invalid Input : ${err.value}`
        })
    }

    return res.status(500).json({
        status: err.status,
        message: "Internal Server Error",
    })

}




