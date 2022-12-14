let str = "UPDATE epms_event_activity_history SET diff = '{obfuscated: obfuscated}' WHERE id > 0 AND epms_event_activity_history.table_name not like ('epms_workflow%') AND epms_event_activity_history.table_name not like ('epms_config') AND epms_event_activity_history.table_name not like ('epms_task%')";


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
