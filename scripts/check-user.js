const { createClerkClient } = require('@clerk/backend');
require('dotenv').config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

(async () => {
  try {
    const email = 'jacksonrichardcastro@gmail.com';
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    
    if (users.data.length > 0) {
      console.log('ACCOUNT_EXISTS: ', users.data[0].id);
    } else {
      console.log('ACCOUNT_NOT_FOUND');
    }
  } catch (e) {
    console.error(e);
  }
})();
