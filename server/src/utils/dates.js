// Next occurrence of a recurring birthday (day+month) after `from`.
// Handles Feb 29 -> Feb 28 in non-leap years.
function nextBirthdayDate(day, month, from = new Date()) {
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const make = (year) => {
    let d = new Date(year, month - 1, day);
    if (month === 2 && day === 29 && d.getMonth() !== 1) d = new Date(year, 1, 28);
    return d;
  };
  let d = make(from.getFullYear());
  if (d < startOfToday) d = make(from.getFullYear() + 1);
  return d;
}

const daysUntil = (date, from = new Date()) =>
  Math.ceil((date - new Date(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);

const atTime = (date, h, m = 0) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);

const addDays = (date, n) => new Date(date.getTime() + n * 86400000);

module.exports = { nextBirthdayDate, daysUntil, atTime, addDays };
