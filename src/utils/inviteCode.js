// 8 karakterli rastgele davet kodu
function generateInviteCode(){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; //karışıklık olmasın diye 0/O/1/I yok
    let code = '';
    for(let i = 0; i<8; i++){
        code += chars[Math.floor(Math.random()* chars.length)];
    }
    return code;
}

module.exports = { generateInviteCode };