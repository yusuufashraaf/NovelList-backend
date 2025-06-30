
const  { validationResult } =require( "express-validator");

// this for validate mongo id before any request go to the controller that save my server form more bad request
 const   validateMongoId = [

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports= validateMongoId;