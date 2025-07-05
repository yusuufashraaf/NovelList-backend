const User = require('./../models/userAuthModel');

 const Authenticate =async (req,res,next)=> {
        
        const token = req.headers.authorization;
        
        let checkToken=token;
            if (token.startsWith('Bearer ')) { // because browser send it by default
                checkToken =token.split(' ')[1];
            }
    
        const user = await User.verifyUser(checkToken)
        if(user){
            req.user = user; 
            next();          
        }else{
            const error = new Error("You are not Authorized");
            error.status = 401; 
            return next(error);
            
        }

}

module.exports = Authenticate;