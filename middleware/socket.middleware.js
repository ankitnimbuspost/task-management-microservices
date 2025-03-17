const jwt = require('jsonwebtoken');

module.exports.authenticateUsers = async function (socket, next) {
    if (socket.handshake.headers.auth) {
        jwt.verify(socket.handshake.headers.auth, process.env.APP_KEY, (err, decoded) => {
            if (err) {
                console.log("Authentication error Socket.");
                return next(new Error('Authentication error, Invalid/Expired Auth Key.'));
            }
            socket.decoded = decoded;
            next();
        });
    } else {
        console.log("Authentication error Socket.");
        next(new Error('Authentication error Socket, Please provide Auth Key'));
    }
}