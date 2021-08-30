const router = require('express').Router()
const passport = require('passport')
const actions = require('./actions')

const { authenticate } = require('../auth/authUtils')
require('../auth/passport')(passport)
router.use('/users', require('./userRouter'))

router.get('/', async (req, res) => {
    res.send('SnapList Server')
})

router.post('/', authenticate, (req, res) => {
    const { action, listName, listId, itemName, itemId, value } = req.body
    const { username, userId } = req.user
    var status = 'failed'
    switch (action) {
        case 'getLists':
            return res.send({ lists: actions.getAllLists(userId) })
        case 'createList':
            const createListResult = actions.createList(userId, listName)
            if (createListResult.error) return res.status(createListResult.status).send(createListResult.error)
            return res.send({ id: createListResult.lastInsertRowid, name: listName })
        case 'renameList':
            const renameListResult = actions.renameList(userId, listId, listName)
            return res.send({action, status: 'success'})
        case 'deleteList':
            const deleteListSuccess = actions.deleteList(userId, listId)
            status = deleteListSuccess ? 'success' : 'failed'
            return res.send({ action, status })
        case 'getItems':
            return res.send(actions.getItems(userId, listId))
        case 'addItem':
            const addItemResult = actions.addItem(userId, listId, itemName)
            if (addItemResult.error) return res.status(addItemResult.status).send(addItemResult.error)
            return res.send(addItemResult)
        // case 'delItem':
        //     const deleteItemResult = actions.deleteItem(userId, itemId)
        //     if (deleteItemResult.error) return res.status(deleteItemResult.status).send(deleteItemResult.error)
        //     return res.send()
        // case 'toggleItemCheck':
        //     actions.toggleItemCheck(userId, itemId)
        //     return res.send()
        case 'setItemCheck':
            actions.setItemCheck(userId, itemId, value)
            res.send({itemId: itemId, checked: value })
        case 'deleteCheckedItems':
            actions.deleteCheckedItems(userId, listId)
            return res.send({ action, status: 'success'})
        case 'deleteAllItems':
            actions.deleteAllItems(userId, listId)
            return res.send({ action, status: 'success'})
        default:
            res.send({ action: 'not found', status: 'failed' })
    }
})

router.get('/initialize', (req, res) => {
    res.send(actions.initialize())
})

module.exports = router