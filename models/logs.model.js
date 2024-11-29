const mongoose = require('mongoose');
const {LOG_TYPE} = require("../config/data.config");
const _ = require('lodash');


const logSchema = mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "users",
        required:true
    },
    action:{
        type:String,
        enum:LOG_TYPE,
        required:true
    },
    prev_data:{
        type:String,
        default: "",
    },
    current_data:{
        type:String,
        default:""
    },
    diff:{
        type:String,
        default:""
    },
    created:{
        type:Number,
        default:Math.floor(Date.now()/1000),
        required:true
    }
});

logSchema.statics.createLog = async function(data){
    const doc1 = data.prev_data;
    const doc2 = data.current_data;
    try {
        const differences = _.reduce(doc1, (result, value, key) => {
            if (!_.isEqual(value, doc2[key])) {
              result[key] = { previous: value, current: doc2[key] };
            }
            return result;
        }, {});
        let insertData = {
            user_id:data.user_id,
            prev_data : JSON.stringify(doc1),
            current_data : JSON.stringify(doc2),
            diff:JSON.stringify(differences),
            action:data.action
        }
        const log = new this(insertData);
        await log.save();
    } catch (error) {
        console.log(error.message)
    }
}

const PanelLog = mongoose.model('panel_log',logSchema);
module.exports=PanelLog;