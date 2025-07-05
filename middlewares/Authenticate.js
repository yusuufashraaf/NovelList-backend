const User = require('./../models/userAuthModel');

 const Authenticate =async (req,res,next)=> {
        const token = req.headers.authorization;
        const user = await User.verifyUser(token)
        if(user){
            req.user =user;
             res.send(req.user);
        }else{
            const error = new Error("You are not Authorized");
            error.status = 401; 
            return next(error);
            
        }

}

module.exports = Authenticate;