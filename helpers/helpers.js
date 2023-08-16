const updateUserId = (db, user) => {
    if(!db || !user) return;

    db.users.forEach((value, index) => {
        if(value.name === user.name){
            db.users[index].id = user.id;
        }
    });
};

const writeDbFile = (db) => {
    fs.writeFile('db.json', JSON.stringify(db),{encoding: 'utf8'}, (err) => {
        console.log(err);
    });
};

module.exports = {
    updateUserId,
    writeDbFile
};