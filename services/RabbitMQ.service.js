const { default: axios } = require("axios");
const MQ = require("../config/rabbitmq.config");
const UsersModel = require("../models/users.model");
module.exports.sendLocalQueue = async function (message) {
    let queue = "M1_LOCAL_QUEUE";
    message = JSON.stringify(message);
    let connection = await MQ.start();
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(message));

    console.log(`[x] Sent data to '${queue}'`);
    // Close the channel
    await channel.close();
    // Close the connection
    await connection.close();
    // Call Queue to Lister Events 
    await this.receiveMessage(queue);
    return true;
}
module.exports.receiveMessage = async function (queue) {
    let connection = await MQ.start();
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: false });
    console.log(`[*] Waiting for messages in ${queue}. To exit, press CTRL+C`);

    channel.consume(queue, async (msg) => {
        const response = msg.content.toString();
        let result = JSON.parse(response);
        console.log(`Receive request from '${queue}'`)
        let responseMessage = '';
        switch (result.event) {
            case "LOG":
                await PanelLog.createLog(result.data);
                break;
            default:
                responseMessage = "Default Case Running user.js";
                break;
        }
        console.log(responseMessage);
    }, { noAck: true });
}
module.exports.receiveAndSendMessage = async function (receive_queue_name, send_queue_name) {
    let connection = await MQ.start();
    const channel = await connection.createChannel();

    await channel.assertQueue(receive_queue_name, { durable: false });
    await channel.assertQueue(send_queue_name, { durable: false });
    console.log(`[*] Waiting for messages in ${receive_queue_name}. To exit, press CTRL+C`);

    channel.consume(receive_queue_name, async (msg) => {
        const response = msg.content.toString();
        let result = JSON.parse(response);
        console.log(`Receive request ${response} from '${receive_queue_name}'`)
        let responseMessage = '';
        switch (result.type) {
            case "STUDENT_INFO":
                responseMessage = "Student info case 1 task.js";
                break;
            case "TEACHER_INFO":
                responseMessage = "Teacher info case 2 task.js";
                break;
            default:
                responseMessage = "Default Case Running task.js";
                break;
        }
        responseMessage = JSON.stringify({'resp':responseMessage});
        setTimeout(() => {
            channel.sendToQueue(send_queue_name, Buffer.from(responseMessage));
            console.log(`[x] Sent response: '${responseMessage}' to '${send_queue_name}'`);
        }, 0); // 1000 milliseconds = 1 seconds
    }, { noAck: true });
}
// This Function Send Message to another Microservice And get response from destination Microservice 
module.exports.sendAndReceiveMessage = async function (send_queue_name,receive_queue_name, request) {
    // This Code Send Message to Queue 
    request = JSON.stringify(request);
    let connection = await MQ.start();
    const channel = await connection.createChannel();
    await channel.assertQueue(send_queue_name, { durable: false });
    channel.sendToQueue(send_queue_name, Buffer.from(request));
    console.log(`[x] Sent '${request}' from '${send_queue_name}'`);
    //Message getting code 
    
    await channel.assertQueue(receive_queue_name, { durable: false });
    // console.log(`[*] Waiting for messages in ${queue}. To exit, press CTRL+C`);
    const message = await new Promise((resolve, reject) => {
        channel.consume(receive_queue_name, (msg) => {
            try {
                const message = msg.content.toString();
                console.info(`Receive request ${message} from '${receive_queue_name}'`)
                resolve(message);
            } catch (error) {
                reject(error);
            }
        }, { noAck: true });
    })
    // Close the channel
    await channel.close();
    // Close the connection
    await connection.close();
    return message;

}

module.exports.getDataFromM1 = async function(reqest_data)
{
    let url = process.env.USER_MICRO_URL+"/api/micro1-request-internal";
    let config = {
        method:"POST",
        url:url,
        data:reqest_data
    };
    let resp = await axios.request(config);
    if(resp.data.code==200)
        return resp.data.data;
    else
        return false;
}