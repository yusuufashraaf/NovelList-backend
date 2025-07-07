const User = require("./../models/userAuthModel");

const AuthenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please login first", status: 401 });
  }

  let checkToken = token.split(" ")[1];

  console.log("checkToken-test:", checkToken);

  const admin = await User.verifyAdmin(checkToken);
  res.locals.userid =admin._id;
  
  if (!admin) {
    return res
      .status(401)
      .json({ message: "You are not Authorized", status: 401 });
  }

  next();
};

module.exports = AuthenticateAdmin;
