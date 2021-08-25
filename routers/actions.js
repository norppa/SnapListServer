const db = require('better-sqlite3')('snaplist.db')



exports.initialize = () => {
    try {
        const initializeDatabase = db.transaction(() => {
            db.prepare('DROP TABLE IF EXISTS lists').run()
            db.prepare('DROP TABLE IF EXISTS items').run()
            db.prepare('DROP TABLE IF EXISTS users').run()
            db.prepare('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL)').run()
            db.prepare('CREATE TABLE lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, owner INTEGER, FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE)').run()
            db.prepare('CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL, checked INTEGER, list INTEGER, FOREIGN KEY(list) REFERENCES lists(id) ON DELETE CASCADE)').run()
        })
        initializeDatabase()

    } catch (e) {
        console.error(e)
        return 'Database initialization failed'
    }
    return 'Database initialized successfully'
}

exports.createList = (userId, listname) => {
    const transaction = db.transaction((listname, userId) => {
        const listExists = db.prepare('SELECT * FROM lists WHERE name=? AND owner=?').get(listname, userId)
        if (listExists) return { error: 'List already exists', status: 400 }
        const result = db.prepare('INSERT INTO lists (name, owner) VALUES (?,?)').run(listname, userId)
        return result
    })

    return transaction(listname, userId)
}

exports.renameList = (userId, listId, listName) => {
    const result = db.prepare('UPDATE lists SET name=? WHERE id=? AND owner=?').run(listName, listId, userId)
    return result
}

exports.deleteList = (userId, listId) => {
    db.prepare('DELETE FROM lists WHERE id=? AND owner=?').run(listId, userId)
}

exports.getAllLists = (userId) => {
    return db.prepare('SELECT id, name FROM lists WHERE owner=?').all(userId)
}

exports.addItem = (userId, listId, itemName) => {
    const list = db.prepare('SELECT * FROM lists WHERE owner=? AND id=?').get(userId, listId)
    if (!list) return { error: 'List not found', status: 400 }
    const result = db.prepare('INSERT INTO items (item, checked, list) VALUES (?,0,?)').run(itemName, listId)
    if (result.changes !== 1) return { error: 'Database error', status: 500 }
    return { id: result.lastInsertRowid, item: itemName, checked: false }
}

exports.deleteItem = (userId, itemId) => {
    const result = db.prepare('DELETE FROM items WHERE id=? AND list IN (SELECT id FROM lists WHERE owner=?)').run(itemId, userId)
    if (result.changes === 0) return { error: 'Item not found', status: 400}
    return {}
}

exports.getItems = (userId, listId) => {
    const result = db.prepare('SELECT id,item,checked FROM items WHERE list=? AND list IN (SELECT id FROM lists WHERE owner=?)').all(listId, userId)
    return { listId, items: result }
}

exports.toggleItemCheck = (userId, itemId) => {
    db.prepare('UPDATE items SET checked = CASE WHEN checked = 0 THEN 1 ELSE 0 END WHERE id=? AND list IN (SELECT id FROM lists WHERE owner=?)').run(itemId, userId)
}

exports.setItemCheck = (userId, itemId, value) => {
    console.log(userId, itemId, value)
    db.prepare('UPDATE items SET checked=? WHERE id=? AND list IN (SELECT id FROM lists WHERE owner=?)')
    .run(value ? 1 : 0, itemId, userId)
}

exports.deleteCheckedItems = (userId, listId) => {
    db.prepare('DELETE FROM items WHERE checked=1 AND list=? AND list in (SELECT id FROM lists WHERE owner=?)').run(listId, userId)
}

exports.deleteAllItems = (userId, listId) => {
    db.prepare('DELETE FROM items WHERE list=? AND list IN (SELECT id FROM lists WHERE owner=?)').run(listId, userId)
}
