const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const employeeService = require('./employee.service');

// simple CRUD REST api
// routes
router.post('/authenticate', authenticate);
router.post('/create', create);
router.get('/search', search);
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
    employeeService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function create(req, res, next) {
    employeeService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function search(req, res, next) {
    employeeService.search(req.query.q)
        .then(users => users ? res.json(users) : res.sendStatus(404))
        .catch(err => next(err))
}

function getById(req, res, next) {
    employeeService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    if (checkToken(req)) {
        employeeService.update(req.params.id, req.body)
            .then(() => res.json({}))
            .catch(err => next(err));
    } else {
        next('invalid token')
    }
}

function _delete(req, res, next) {
    if (checkToken(req)) {
        employeeService.delete(req.params.id)
            .then(() => res.json({}))
            .catch(err => next(err));
    } else {
        next('invalid token')
    }
}