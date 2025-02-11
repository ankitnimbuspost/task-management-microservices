module.exports = class CommonHelper{
    constructor(){

    }
    static converToDate(timestamp){
        const date = new Date(timestamp * 1000);
        const options = { day: '2-digit', month: 'short', year: 'numeric',hour:"2-digit",minute:"2-digit",timeZone: 'Asia/Kolkata' };
        return  new Intl.DateTimeFormat('en-US', options).format(date);
    }
    // Convert Timestamp to Date. Format (November 11, 2024 at 12:04 PM)
    static converToDate1(timestamp){
        if (!timestamp) return "";
        const date = new Date(timestamp * 1000);
        const options = { day: '2-digit', month: 'long', year: 'numeric',hour:"2-digit",minute:"2-digit",hour12: true,timeZone: 'Asia/Kolkata' };
        return  new Intl.DateTimeFormat('en-US', options).format(date);
    }
}