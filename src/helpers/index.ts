import crypto from 'crypto';
import moment from 'moment';
import momentTZ from 'moment-timezone';

momentTZ().tz('Asia/Karachi');

function checkRankPeriod(joining: Date): boolean {
  return (
    moment.duration(moment().diff(joining)).asSeconds() > 30 * 24 * 60 * 60
  );
}

const applyPercentage = (amount: number, percentage: number): number => {
  return (amount * percentage) / 100;
};

const firstDayOfLastMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

const lastDayOfLastMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0);
};

const minusDaysFromDate = (count: number): string => {
  const date = new Date();
  return new Date(date.setDate(date.getDate() - count)).toISOString();
};

const currentDate = (): Date => {
  return new Date();
};

const uuid = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Extending String prototype in TypeScript requires declaration merging
declare global {
  interface String {
    capitalizeFirst(): string;
  }
}

String.prototype.capitalizeFirst = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

const startOfToday = (): string => {
  return moment().startOf('day').format();
};

const endOfToday = (): string => {
  return moment().endOf('day').format();
};

const randomUUID = crypto.randomUUID;

export {
  applyPercentage,
  firstDayOfLastMonth,
  lastDayOfLastMonth,
  minusDaysFromDate,
  currentDate,
  uuid,
  randomUUID,
  capitalizeFirstLetter,
  startOfToday,
  endOfToday,
  checkRankPeriod,
};
