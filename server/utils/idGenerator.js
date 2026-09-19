const Counter = require('../models/Counter');

// Atomically reserves the next sequence number for `counterName` and formats
// it as `${prefix}${paddedNumber}` (e.g. STU0001), so IDs never collide even
// under concurrent creation and Admins never have to type/guess one.
async function nextFormattedId(counterName, prefix, padLength = 4) {
  const counter = await Counter.findByIdAndUpdate(
    counterName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${String(counter.seq).padStart(padLength, '0')}`;
}

module.exports = { nextFormattedId };
