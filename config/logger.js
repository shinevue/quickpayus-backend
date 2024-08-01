
const winston = require("winston");
const { ElasticsearchTransport } = require("winston-elasticsearch");
const { Client } = require("@elastic/elasticsearch");

// Elasticsearch client setup
const esClient = new Client({ node: "http://localhost:3001" });

// Winston logger setup with Elasticsearch transport
const esTransportOpts = {
    level: "info",
    client: esClient,
    indexPrefix: "otp_logs",
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new ElasticsearchTransport(esTransportOpts),
    ],
});

module.exports = logger;