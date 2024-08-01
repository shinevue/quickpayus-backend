const logger = require("../config/logger");

module.exports = async (req, res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        user_id: req.user.id,
        ip_address: req.ip,
        request_type: req.body.request_type || "login",
        status: "initiated",
    };

    logger.info(logEntry);
    req.logEntry = logEntry;
    next();
};
