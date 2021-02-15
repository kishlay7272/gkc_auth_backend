module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'string':
            return res.status(400).json({ message: err });
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });
        default:
            return res.status(500).json({ message: err.message });
    }
}