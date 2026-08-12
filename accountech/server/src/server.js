const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`AccounTech API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
