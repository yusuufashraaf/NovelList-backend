const User = require("./../models/userAuthModel");

const Authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  // console.log("token:", token);

  // console.log("== Incoming request ==");
  // console.log("Authorization:", token);
  // console.log("Headers:", req.headers);
  // console.log("== End of request ==");

  // protect routes from empty token requests
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please login first", status: 401 });
  }

  let checkToken = token.split(" ")[1];

  console.log("checkToken-test:", checkToken);

  const user = await User.verifyUser(checkToken);
  res.locals.userid =user._id;

  if (!user) {
    return res
      .status(401)
      .json({ message: "You are not Authorized", status: 401 });
  }

  req.user = user;

  next();
};

module.exports = Authenticate;
