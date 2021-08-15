const router = require('express').Router()
const passport = require('passport')
const actions = require('./actions')
const db = require('better-sqlite3')('snaplist.db')

const { authenticate } = require('../auth/authUtils')
require('../auth/passport')(passport)
router.use('/users', require('./userRouter'))

router.get('/', async (req, res) => {
    res.send('SnapList Server')
})

router.post('/', authenticate, (req, res) => {
    const { action, listName, listId, itemName, itemId } = req.body
    const { username, userId } = req.user
    switch (action) {
        case 'getLists':
            return res.send(actions.getAllLists(userId))
        case 'createList':
            const createListResult = actions.createList(userId, listName)
            if (createListResult.error) return res.status(createListResult.status).send(createListResult.error)
            return res.send({ id: createListResult.lastInsertRowid, name: listName })
        case 'renameList':
            const renameListResult = actions.renameList(userId, listId, listName)
            return res.send()
        case 'deleteList':
            actions.deleteList(userId, listId)
            return res.send()
        case 'getItems':
            return res.send(actions.getItems(userId, listId))
        case 'addItem':
            const addItemResult = actions.addItem(userId, listId, itemName)
            if (addItemResult.error) return res.status(addItemResult.status).send(addItemResult.error)
            return res.send(addItemResult)
        case 'delItem':
            const deleteItemResult = actions.deleteItem(userId, itemId)
            if (deleteItemResult.error) return res.status(deleteItemResult.status).send(deleteItemResult.error)
            return res.send()
        case 'toggleItemCheck':
            actions.toggleItemCheck(userId, itemId)
            return res.send()
        case 'deleteCheckedItems':
            actions.deleteCheckedItems(userId, listId)
            return res.send()
        case 'deleteAllItems':
            actions.deleteAllItems(userId, listId)
            return res.send()
        default:
            res.send('action not found')
    }
})

router.get('/initialize', (req, res) => {
    res.send(actions.initialize())
})

module.exports = router