import express from "express";
import routes from "./routes/index";
import refugeeRoutes from "./routes/refugee";
import refugeeProtectedRoutes from "./routes/refugeeProtected";
import donateRoutes from "./routes/donate";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.urlencoded({ extended: true }));

// enable CORS
app.use(function(req, res, next) {
  console.log("ENABLING CORS");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/api", routes);

app.use("/api/refugee", refugeeRoutes);
//app.use("/api/refugee", requireAuth, refugeeProtectedRoutes);
app.use("/api/refugee", refugeeProtectedRoutes);
app.use("/api/donate", donateRoutes);

app.listen(PORT, () => {
  console.log(`Please navigate to port ${PORT}`);
});

// middleware for authenticating valid tokens
// endpoints defined after this are protected
function requireAuth(req, res, next) {
  console.log("checking token");
  // check header or url parameters or post parameters for token
  let token =
    req.body.token || req.query.token || req.headers["x-access-token"];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, "secretkey", function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: "Failed to authenticate token."
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: "No token provided."
    });
  }
}
