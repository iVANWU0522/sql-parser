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

    parsed.logEvents.forEach((logEvent) => {
        processMessage(logEvent.message, callback);
    });
    return `Successfully processed ${parsed.logEvents.length} log events.`;
};

const processMessage = (message, callback) => {
    const timeRegex = /\# Time: (\d*-\d*-\d*T\d*:\d*:\d*.\d*Z)\#?/g;
    const userRegex = /\# User@Host: (\S*\[\S*\] @  \[\d*.\d*.\d*.\d*])/g;
    const idRegex = /Id:\s\d*/g;
    const queryTimeRegex = /\# Query_time: (\d|\.)*\s+Lock/g;
    const lockTimeRegex = /Lock_time: (\d|\.)*\s+Rows/g
    const rowsSentRegex = /Rows_sent: (\d|\.)*\s+Rows/g;
    const rowsExaminedRegex = /Rows_examined: (\d|\.)*\s+/g;
    const queryRegex = /(use|USE|set|SET)\s+(.|(\r\n|\r|\n))*/g;

    const time = message.match(timeRegex)[0].split(" ")[2];
    const user = message.match(userRegex)[0].split(" ")[2];
    const id = message.match(idRegex)[0].split(" ")[1];
    const queryTime = message.match(queryTimeRegex)[0].split(" ")[2];
    const lockTime = message.match(lockTimeRegex)[0].split(" ")[1];
    const rowsSent = message.match(rowsSentRegex)[0].split(" ")[1];
    const rowsExamined = message.match(rowsExaminedRegex)[0].split(" ")[1];
    const query = message.match(queryRegex)[0];

    const databaseNameRegex = /use\s+(\w*)\;?/g;

    const databaseName = query.match(databaseNameRegex)[0].split(" ")[1];

    let markedQuery = query;

    const regex = /(=|<>|<|>|<=|>=|BETWEEN|between|LIKE|like|IN|in)\s+(\d|'([^']*)'|\('[^']*'\))/g;

    const matchedSlots = markedQuery.match(regex);

    if (matchedSlots) {
        matchedSlots.forEach((slot) => {
            const key = slot.split(" ")[0];
            markedQuery = markedQuery.replace(slot, `${key} ****`);
        });
    }

    const sql = `INSERT INTO slow_query(time, user, event_log_id, query_time, lock_time, rows_sent, rows_examined, marked_query, original_query, database_name) VALUES('${time}', '${user}', ${id}, ${queryTime}, ${lockTime}, ${rowsSent}, ${rowsExamined}, "${markedQuery}", "${query}", '${databaseName}');`;
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
}
