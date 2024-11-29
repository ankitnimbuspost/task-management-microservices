const amqp = require('amqplib');
module.exports.start = async function(){
    var connection = await amqp.connect('amqp://localhost');
    console.log("Queue Started...");
    return connection;
}
// module.exports.config = {
//     //Listening 
//     SEND_MESSAGE_TO_M1_FROM_M2 : "send_message_to_m1_from_m2",
//     RECEIVE_MESSAGE_FROM_M1_TO_M2: "receive_message_from_m1_to_m2",
    
//     //RECEIVE_MESSAGE_FROM_M1 is used to Receive message from M1 to M2 and SEND_MESSAGE_TO_M1 is used to send message to M1 from M2
//     RECEIVE_MESSAGE_FROM_M1:"send_message_from_m1",
//     SEND_MESSAGE_TO_M1:"receive_message_from_m2"
// }
module.exports.config = {
    /* ***************Send Message from User Micro & Receive Message Task Micro**************************
    Send Message from M1 to M2 User Micro  AND  Receive message from M1 to M2 Task Micro 
    Event Name (Sending) User Micro & Listner Name (Receiving) Task Micro Both use Same Params */
    SEND_MESSAGE_FROM_M1_TO_M2 : "SEND_MESSAGE_FROM_M1_TO_M2",

    /* Send Message from M2 to M1 Task Micro AND Receive message from M2 to M1 User Micro
       Event Name (Sending) Task Micro & Listner Name (Receiving) User Micro Both use Same Params */
    SEND_MESSAGE_FROM_M2_TO_M1 : "SEND_MESSAGE_FROM_M2_TO_M1",


    /* ******************Send Message from Task Micro & Receive Message User Micro***********************
    Send Message from M2 to M1 Task Micro AND Receive message from M2 to M1 User Micro
    Event Name (Sending) Task Micro & Listner Name (Receiving) User Micro Both use Same Params */
    SEND_MESSAGE_FROM_M2_TO_M1_REV : "SEND_MESSAGE_FROM_M2_TO_M1_REV",

    /*Send Message from M1 to M2 User Micro  AND Receive message from M1 to M2 Task Micro
    //Event Name (Sending) User Micro & Listner Name (Receiving) Task Micro Both use Same Params*/
    SEND_MESSAGE_FROM_M1_TO_M2_REV:"SEND_MESSAGE_FROM_M1_TO_M2_REV",
}