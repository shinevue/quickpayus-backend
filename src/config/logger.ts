import winston from 'winston';
import {
  ElasticsearchTransport,
  ElasticsearchTransportOptions,
} from 'winston-elasticsearch';
import { Client } from '@elastic/elasticsearch';

// Elasticsearch client setup
const esClient = new Client({ node: 'http://localhost:3001' });

// Elasticsearch transport options
const esTransportOpts: ElasticsearchTransportOptions = {
  level: 'info',
  client: esClient,
  indexPrefix: 'otp_logs',
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new ElasticsearchTransport(esTransportOpts),
  ],
});

export default logger;
