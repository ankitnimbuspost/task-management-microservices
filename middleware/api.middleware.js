const jwt = require("jsonwebtoken");
const httpCode = require("../config/error.config");

module.exports.checkJWTToken = async function(req,res,next){
    let disableRoutes = ['/signup',"/signin",'/test'];
    if(!disableRoutes.includes(req._parsedUrl.pathname))
    {
        if(req.headers.authorization==undefined || req.headers.authorization=='')
            return res.json({code:httpCode.FORBIDDEN,"message":"Please provide access token."});
        let access_token = req.headers.authorization.replace("Bearer ","");
        // verify a token symmetric
        jwt.verify(access_token, process.env.APP_KEY, (err, decoded) => {
            if (err) 
                return res.json({code:httpCode.FORBIDDEN,"message":"Your token has been expired or may be incorrect."});
            else
            {
                req.user= decoded;
                next();
            }
        });
    }
    else
        next();
}