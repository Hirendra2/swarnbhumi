const jwt = require("jsonwebtoken");

const blacklistedTokens = [];
const Auth = async function (req, res, next) {
  try {
    const token = req.header('x-api-key');
    if (!token) {
      res.status(403).send({ status: false, message: "Token is not present, please log in again" });
      return;
    }

    if (blacklistedTokens.includes(token)) {
      res.status(401).send({ status: false, logout: 1, message: "Token has been revoked. Please log in again." });
      return;
    }

    const decodedtoken = await jwt.verify(token, 'Group9');
    if (decodedtoken) {
      req.user = decodedtoken.email;
      next();
    }
  } catch (err) {
    res.status(500).send({ status: false, logout: 0, message: "Token has expired" });
  }
};

const logout = function (req, res) {
  const token = req.header('x-api-key');
  if (token) {
    // Add the token to the blacklist (if it's not already there)
    if (!blacklistedTokens.includes(token)) {
      blacklistedTokens.push(token);
    }
  }
  res.json({ status: true, message: "Logged out successfully" });
};

const tokenStatus = async function (req, res) {
  try {
    const token = req.header('x-api-key');
    if (!token) {
      return res.status(400).send({ status: false, message: "Please enter the token" });
    }

    const decodedtoken = await jwt.decode(token);
   //console.log(decodedtoken.exp,Math.floor(Date.now() / 1000))
// let time = Date.now();
    if (decodedtoken === null) {
      
      res.status(403).send({ status: false, message: "Invalid token provided" });
    } else if (decodedtoken.exp  === Math.floor(Date.now() / 1000)) {
      res.status(401).send({ status: false, logout: 0, message: "Token has expired" });
    } else {
      res.status(200).send({ status: true, message: "Token is valid" });
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.Auth = Auth;
module.exports.logout = logout;
module.exports.tokenStatus = tokenStatus;
