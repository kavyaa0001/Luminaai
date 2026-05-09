module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Backend is ALIVE via CJS!',
    env_check: process.env.DATABASE_URL ? 'DB_SET' : 'DB_MISSING'
  });
};
