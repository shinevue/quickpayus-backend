const crypto = require("crypto");
const { randomUUID } = crypto;
const moment = require("moment");
const momentTZ = require("moment-timezone");
momentTZ().tz("Asia/Karachi");

function checkRankPeriod(joining) {
  if (moment.duration(moment().diff(joining)).asSeconds() > 30 * 24 * 60 * 60)
    return true;
  return false;
}

const applyPercentage = (amount, percentage) => {
  return (amount * percentage) / 100;
};

const firstDayOfLastMonth = () => {
  new Date(now.getFullYear(), now.getMonth() - 1, 1);
};

const lastDayOfLastMonth = () => {
  new Date(now.getFullYear(), now.getMonth(), 0);
};

const minusDaysFromDate = (count) => {
  const date = new Date();
  return new Date(date.setDate(date.getDate() - count)).toISOString();
};

const currentDate = () => {
  return new Date();
};

const uuid = () => {
  return crypto.randomBytes(24).toString("hex");
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

Object.defineProperty(String.prototype, "capitalizeFirst", {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false,
});

const startOfToday = () => {
  return moment().startOf("day").format(); // set to 12:00 am today
};

const endOfToday = () => {
  return moment().endOf("day").format(); // set to 12:00 am today
};

module.exports = {
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
