const { executeQuery, initializeDatabase } = require('./backend/config/database');
const GlobalUsersModel = require('./backend/models/GlobalUsers');
const CorePortfoliosModel = require('./backend/models/CorePortfolios');

async function test() {
  try {
    await initializeDatabase();
    await GlobalUsersModel.createGlobalUsersTable();
    await CorePortfoliosModel.createCorePortfoliosTable();

    const user = await GlobalUsersModel.createUser({
      fullName: 'Test User',
      email: 'testdelete@example.com',
      passSecureHash: 'hash',
    });
    console.log('Created user:', user);
    
    await GlobalUsersModel.deleteUser(user.id);
    console.log('Deleted user');
    
    const check = await GlobalUsersModel.getUserById(user.id);
    console.log('Check user exists:', check);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
