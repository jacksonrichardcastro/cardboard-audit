const { createClerkClient } = require('@clerk/backend');
require('dotenv').config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

(async () => {
  try {
    const email = 'persistence_test@trax.cards';
    const password = 'TestPassword123!';

    // Check if user exists
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    let userId;
    if (users.data.length > 0) {
      console.log('User already exists:', users.data[0].id);
      userId = users.data[0].id;
    } else {
      const user = await clerk.users.createUser({
        emailAddress: [email],
        password: password,
        skipPasswordChecks: true,
      });
      console.log('Created user:', user.id);
      userId = user.id;
    }
    console.log(`Credentials: email=${email}, password=${password}`);
  } catch (e) {
    console.error(e);
  }
})();
