module.exports = class CommonHelper{
    constructor(){

    }
    static converToDate(timestamp){
        const date = new Date(timestamp * 1000);
        const options = { day: '2-digit', month: 'short', year: 'numeric',hour:"2-digit",minute:"2-digit" };
        return  new Intl.DateTimeFormat('en-US', options).format(date);
    }
}