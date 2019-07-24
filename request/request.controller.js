const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const requestService = require('./request.service');

// simple CRUD REST api
// routes
router.post('/create', create);
router.post('/sign', sign);
router.get('/getAll', getAll);
router.get('/viewForm', viewForm);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

// TODO: add permissions
const getUserId = (req) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        const decoded = jwt.decode(token);
        if (decoded.sub) {
            return decoded.sub
        }
    }
    return null
}

function create(req, res, next) {
    requestService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function sign(req, res, next) {
    const user_id = getUserId(req)
    requestService.sign(req.body.id, req.body.type, user_id)
        .then(url => res.json({url}))
        .catch(err => next(err));
}

function getById(req, res, next) {
    const user_id = getUserId(req)
    requestService.getById(req.params.id, user_id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    requestService.getAll(req.query)
        .then(users => users ? res.json(users) : res.sendStatus(404))
        .catch(err => next(err));
}

function viewForm(req, res, next) {
    const user_id = getUserId(req)
    requestService.generateForm(req.query.id, req.query.type, user_id)
        .then(response => {
            if (response.pdf) {
                res.end(response.pdf);
            } else {
                res.sendStatus(404)
            }
        }).catch(err => next(err));
}

function update(req, res, next) {
    const user_id = getUserId(req)
    requestService.update(req.params.id, req.body, user_id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    const user_id = getUserId(req)
    requestService.delete(req.params.id, user_id)
        .then(() => res.json({}))
        .catch(err => next(err));
}