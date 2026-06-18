import express from 'express';

const router = express.Router();

router.get('/welcome', (req, res) => {
    res.json({ message: 'Hello from the lazy-init backend!' });
});

export default router;