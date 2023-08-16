const updateUserId = (db, user) => {
    if(!db || !user) return;

    db.users.forEach((value, index) => {
        if(value.name === user.name){
            db.users[index].id = user.id;
        }
    });
}

module.exports = {
    updateUserId
}