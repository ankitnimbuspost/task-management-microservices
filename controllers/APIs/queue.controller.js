const mq_config = require("../../config/rabbitmq.config")
const MQService = require("../../services/RabbitMQ.service");

module.exports.startQueue = async function (req, res) {
    await MQService.receiveAndSendMessage(
        mq_config.config.SEND_MESSAGE_FROM_M1_TO_M2,
        mq_config.config.SEND_MESSAGE_FROM_M2_TO_M1
    );
    res.send("Queue Started Task Management Microservices");
}
module.exports.test = async function (req, res) {
    let request = {
        type:"STUDENT_INFO",
        data:{
            "student_name":"Ankit Kr Thakur",
            "roll_no":"1"
        }
    };
    let data = await MQService.sendAndReceiveMessage(
        mq_config.config.SEND_MESSAGE_FROM_M2_TO_M1_REV,
        mq_config.config.SEND_MESSAGE_FROM_M1_TO_M2_REV,
        request
    );
    res.send(data);

}