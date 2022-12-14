const zlib = require('zlib');
const mysql = require('mysql');

const con = mysql.createConnection({
    host: process.env.RDS_HOSTNAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT,
    database: process.env.RDS_DATABASE
});

exports.handler = (event, context, callback) => {
    const payload = Buffer.from(event.awslogs.data, 'base64');
    const parsed = JSON.parse(zlib.gunzipSync(payload).toString('utf8'));
    console.log('Decoded payload:', JSON.stringify(parsed));

    const eventMessage = parsed.logEvents[0].message;

    const timeRegex = /\# Time: (\d*-\d*-\d*T\d*:\d*:\d*.\d*Z)\#?/g;
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

    const databaseNameRegex = /use\s+(\w*)\;?/g;

    const databaseName = query.match(databaseNameRegex)[0].split(" ")[1];

    let str = query;

    const regex = /(=|<>|<|>|<=|>=|BETWEEN|between|LIKE|like|IN|in)\s+(\d|'([^']*)'|\('[^']*'\))/g;

    const matchedSlots = str.match(regex);

    if (!matchedSlots) {
        matchedSlots.forEach((slot) => {
            const key = slot.split(" ")[0];
            str = str.replace(slot, `${key} ****`);
        });
    }

    const sql = `INSERT INTO slow_query(time, user, event_log_id, query_time, lock_time, rows_sent, rows_examined, marked_query, original_query, database_name) VALUES('${time}', '${user}', ${id}, ${queryTime}, ${lockTime}, ${rowsSent}, ${rowsExamined}, "${str}", "${query}", '${databaseName}');`;
    // allows for using callbacks as finish/error-handlers
    // context.callbackWaitsForEmptyEventLoop = false;

    con.query(sql, function (error, results, fields) {
        if (error) {
            con.destroy();
            throw error;
        } else {
            console.log(results);
            callback(error, results);
            con.end(function (err) { callback(err, results); });
        }
    });

    return `Successfully processed ${parsed.logEvents.length} log events.`;
};
