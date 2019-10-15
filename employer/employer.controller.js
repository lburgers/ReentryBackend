const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const employerService = require('./employer.service');

// simple CRUD REST api
// routes
router.post('/authenticate', authenticate);
router.post('/create', create);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

const checkToken = (req) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        const decoded = jwt.decode(token);
        if (decoded.sub === req.params.id) {
            return true
        }
    }
    return false
}

function authenticate(req, res, next) {
    employerService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function create(req, res, next) {
    employerService.create(req.body)
        .then(() => res.json({}))
            .catch(err => {
                console.log(err)
                next(err)
            });
}

function getById(req, res, next) {
    if (checkToken(req)) {
        employerService.getById(req.params.id)
            .then(user => user ? res.json(user) : res.sendStatus(404))
            .catch(err => next(err));
    } else {
        next('invalid token')
    }
}

function update(req, res, next) {
    if (checkToken(req)) {
        employerService.update(req.params.id, req.body)
            .then((user) => res.json(user))
            .catch(err => next(err));
    } else {
        next('invalid token')
    }
}

function _delete(req, res, next) {
    if (checkToken(req)) {
        employerService.delete(req.params.id)
            .then(() => res.json({}))
            .catch(err => next(err));
    } else {
        next('invalid token')
    }
}