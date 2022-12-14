const eventMessage = `
# Time: 2022-11-21T13:14:58.189585Z
# User@Host: devops_bot[devops_bot] @  [10.0.12.34]  Id: 58700
# Query_time: 408.768573  Lock_time: 0.000422 Rows_sent: 0  Rows_examined: 37946967
use pmstmp_lifestylesolutions;
SET timestamp=1669036498;
UPDATE epms_event_activity_history SET diff = '{obfuscated: obfuscated}' WHERE id > 0 AND epms_event_activity_history.table_name not like ('epms_workflow%') AND epms_event_activity_history.table_name not like ('epms_config') AND epms_event_activity_history.table_name not like ('epms_task%');
`;

const timeRegex = /\# Time: (\d*-\d*-\d*T\d*:\d*:\d*.\d*Z)/g;
const userRegex = /\# User@Host: (\S*\[\S*\] @  \[\d*.\d*.\d*.\d*])/g;
const idRegex = /Id:\s\d*/g;
const queryTimeRegex = /\# Query_time: (\d|\.)*\s+Lock/g;
const lockTimeRegex = /Lock_time: (\d|\.)*\s+Rows/g
const rowsSentRegex = /Rows_sent: (\d|\.)*\s+Rows/g;
const rowsExaminedRegex = /Rows_examined: (\d|\.)*\s+/g;
const queryRegex = /use\s+(.|(\r\n|\r|\n))*/g;

const time = eventMessage.match(timeRegex)[0].split(" ")[2];
const user = eventMessage.match(userRegex)[0].split(" ")[2];
const id = eventMessage.match(idRegex)[0].split(" ")[1];
const queryTime = eventMessage.match(queryTimeRegex)[0].split(" ")[2];
const lockTime = eventMessage.match(lockTimeRegex)[0].split(" ")[1];
const rowsSent = eventMessage.match(rowsSentRegex)[0].split(" ")[1];
const rowsExamined = eventMessage.match(rowsExaminedRegex)[0].split(" ")[1];
const query = eventMessage.match(queryRegex)[0];

console.log(time, user, id, queryTime, lockTime, rowsSent, rowsExamined, query);

let str = query;

const regex = /(=|<>|<|>|<=|>=|BETWEEN|between|LIKE|like|IN|in)\s+(\d|'([^']*)'|\('[^']*'\))/g;
// const str = "SELECT * FROM users WHERE name='John'";
const matchedSlots = str.match(regex);

matchedSlots.forEach((slot) => {
    const key = slot.split(" ")[0];
    str = str.replace(slot, `${key} ****`);
});

console.log(str);

// if (result) {
//     const value = result[1];  // value will be "name='John'"
//     console.log(value);
// }
